/**
 * Couche de persistance (Phase 1 "vrai backend") : commerces, utilisateurs
 * et administrateurs plateforme survivent desormais aux redemarrages a
 * froid et aux changements d'instance serverless (Vercel), via Postgres
 * (Neon). Tout le reste (clients, produits, factures, devis...) continue
 * de vivre uniquement en memoire, hors perimetre de cette phase.
 *
 * Strategie deliberement simple ("hydrater au demarrage, reecrire apres
 * chaque requete") plutot qu'une conversion complete des ~40 lectures de
 * `businesses`/`users`/`platformAdmins` en requetes SQL : ca laisse toute
 * la logique metier existante inchangee (elle continue de lire/ecrire ces
 * tableaux comme avant), et ne necessite d'ajouter du code qu'aux points
 * de demarrage et de sauvegarde. Les deux verifications de securite
 * sensibles au delai (compte actif, commerce suspendu) contournent ce
 * cache en memoire et interrogent Postgres en direct a chaque requete
 * authentifiee, pour une revocation reellement immediate.
 */

const { neon } = require('@neondatabase/serverless')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const DATABASE_URL = process.env.DATABASE_URL

/** true si une base Postgres est configuree (sinon, repli complet sur l'ancien comportement en memoire pure). */
const persistenceEnabled = Boolean(DATABASE_URL)

const sql = persistenceEnabled ? neon(DATABASE_URL) : null

/**
 * Secret de signature des jetons JWT. En local, un repli de confort est
 * accepte (jamais utilise avec de vraies donnees). Sur Vercel, l'absence
 * de JWT_SECRET est une erreur de configuration bloquante : on refuse de
 * demarrer avec un secret devinable dans un environnement public.
 */
const JWT_SECRET = process.env.JWT_SECRET || (process.env.VERCEL ? null : 'dev-only-insecure-secret')
if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET manquant. Definissez-le dans les variables d'environnement Vercel du projet (chaine aleatoire, ex: openssl rand -hex 32)."
  )
}

// --- Schema ---------------------------------------------------------------

/** Cree les tables si absentes. Idempotent, appele a chaque demarrage a froid. */
async function ensureSchema() {
  if (!persistenceEnabled) return
  await sql`CREATE TABLE IF NOT EXISTS businesses (id TEXT PRIMARY KEY, data JSONB NOT NULL)`
  await sql`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, data JSONB NOT NULL)`
  await sql`CREATE TABLE IF NOT EXISTS platform_admins (id TEXT PRIMARY KEY, data JSONB NOT NULL)`
}

// --- Hydratation / persistance des tableaux en memoire ---------------------

/**
 * Recharge `businesses`/`users`/`platformAdmins` depuis Postgres dans les
 * tableaux en memoire fournis (mutation en place, par reference : le reste
 * du fichier server.js continue d'utiliser exactement les memes tableaux).
 * Sans base configuree (dev local sans DATABASE_URL), ne fait rien : les
 * tableaux restent vides jusqu'au seed en memoire habituel.
 */
async function hydrate(businesses, users, platformAdmins) {
  if (!persistenceEnabled) return
  await ensureSchema()

  const [businessRows, userRows, adminRows] = await Promise.all([
    sql`SELECT data FROM businesses`,
    sql`SELECT data FROM users`,
    sql`SELECT data FROM platform_admins`
  ])

  businesses.push(...businessRows.map((r) => r.data))
  users.push(...userRows.map((r) => r.data))
  platformAdmins.push(...adminRows.map((r) => r.data))
}

/**
 * Reconcilie Postgres avec l'etat courant des trois tableaux en memoire :
 * supprime les lignes qui n'existent plus (suppression de commerce/
 * utilisateur/admin), puis upsert chaque entree courante. Appele apres
 * chaque requete (voir le middleware dans server.js) : simple et
 * infaillible (aucun risque d'oublier un point de mutation), le volume de
 * donnees de ces trois tables reste minuscule pour une demo.
 */
async function persistAll(businesses, users, platformAdmins) {
  if (!persistenceEnabled) return

  await Promise.all([
    reconcileTable('businesses', businesses),
    reconcileTable('users', users),
    reconcileTable('platform_admins', platformAdmins)
  ])
}

/**
 * `table` provient toujours d'une liste blanche interne fixe ('businesses',
 * 'users', 'platform_admins' — jamais d'entree utilisateur) : l'interpoler
 * directement dans la chaine SQL est sans risque d'injection ici. Le
 * pilote Neon serverless ne fournit pas d'helper d'identifiant parametre
 * (contrairement a `postgres.js`) ; seules les VALEURS sont parametrees
 * via $1/$2.
 */
async function reconcileTable(table, records) {
  const ids = records.map((r) => r.id)

  if (ids.length === 0) {
    // Table entierement videe (rare) : purge complete plutot qu'un
    // `WHERE id != ALL($1)` avec un tableau vide (qui ne supprimerait rien).
    await sql(`DELETE FROM ${table}`)
    return
  }

  await sql(`DELETE FROM ${table} WHERE id != ALL($1)`, [ids])

  for (const record of records) {
    await sql(
      `INSERT INTO ${table} (id, data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET data = $2`,
      [record.id, JSON.stringify(record)]
    )
  }
}

// --- Verifications "live" (revocation immediate) ---------------------------

/**
 * Statut actif d'un utilisateur/admin lu EN DIRECT depuis Postgres
 * (jamais depuis le tableau en memoire, potentiellement obsolete sur une
 * autre instance serverless que celle qui a effectue la desactivation).
 * Renvoie `true` si la persistance n'est pas configuree (repli sur le
 * comportement precedent, verifie uniquement en memoire par l'appelant).
 */
async function isRecordActiveLive(table, id) {
  if (!persistenceEnabled) return true
  const rows = await sql(`SELECT data->>'isActive' AS is_active FROM ${table} WHERE id = $1`, [id])
  if (rows.length === 0) return false
  return rows[0].is_active === 'true'
}

/** Statut de suspension d'un commerce, lu en direct (meme raison que ci-dessus). */
async function isBusinessSuspendedLive(businessId) {
  if (!persistenceEnabled) return false
  const rows = await sql`SELECT data->>'isSuspended' AS is_suspended FROM businesses WHERE id = ${businessId}`
  if (rows.length === 0) return false
  return rows[0].is_suspended === 'true'
}

// --- Mots de passe -----------------------------------------------------

async function hashPassword(plain) {
  return bcrypt.hash(plain, 10)
}

async function verifyPassword(plain, hash) {
  if (!hash) return false
  return bcrypt.compare(plain, hash)
}

// --- Jetons JWT ----------------------------------------------------------

/**
 * `realm` distingue commercant/admin : un jeton emis pour un realm n'est
 * jamais accepte sur les routes de l'autre (meme garantie que l'ancien
 * systeme, qui utilisait deux `Map` completement separees).
 */
function signAccessToken(id, realm) {
  return jwt.sign({ sub: id, realm, typ: 'access' }, JWT_SECRET, { expiresIn: '1h' })
}

function signRefreshToken(id, realm) {
  return jwt.sign({ sub: id, realm, typ: 'refresh' }, JWT_SECRET, { expiresIn: '30d' })
}

/** Verifie un jeton et son type/realm attendus. Renvoie l'id du sujet, ou `null` si invalide/expire/type incorrect. */
function verifyToken(token, expectedRealm, expectedType) {
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    if (payload.realm !== expectedRealm || payload.typ !== expectedType) return null
    return payload.sub
  } catch {
    return null
  }
}

module.exports = {
  persistenceEnabled,
  ensureSchema,
  hydrate,
  persistAll,
  isRecordActiveLive,
  isBusinessSuspendedLive,
  hashPassword,
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  verifyToken
}
