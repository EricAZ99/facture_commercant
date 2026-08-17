/**
 * Backend factice pour tester le frontend Facture IA en local.
 *
 * Donnees en memoire (perdues au redemarrage), aucune securite reelle
 * (mots de passe en clair, jetons non signes). Ce N'EST PAS le backend
 * de production Node/Express a construire : c'est un outil de dev pour
 * valider le frontend (auth + tableau de bord) sans backend reel.
 *
 * Demarrage: npm install && npm start   (ecoute sur http://localhost:4000)
 * Compte de demo pre-cree (donnees d'exemple) : demo@facture-ia.com / password123
 * Un compte cree via l'inscription demarre volontairement vide (etat "sans donnees").
 */

const express = require('express')
const cors = require('cors')
const crypto = require('crypto')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const PORT = process.env.PORT || 4000
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173'

const app = express()
app.use(cors({ origin: CORS_ORIGIN }))
app.use(express.json())

// --- Stockage des logos uploades ------------------------------------------

const UPLOADS_DIR = path.join(__dirname, 'uploads')
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true })
app.use('/uploads', express.static(UPLOADS_DIR))

const LOGO_ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
const LOGO_MAX_SIZE_BYTES = 2 * 1024 * 1024

const uploadLogo = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${path.extname(file.originalname)}`)
  }),
  limits: { fileSize: LOGO_MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!LOGO_ACCEPTED_TYPES.includes(file.mimetype)) {
      cb(new Error('INVALID_FILE_TYPE'))
      return
    }
    cb(null, true)
  }
})

// --- "Base de donnees" en memoire ------------------------------------------

const businesses = []
const users = []
const clients = []
const products = []
const invoices = []
const payments = []
const subscriptions = []
const activities = []
/** token -> userId */
const accessTokens = new Map()
/** token -> userId */
const refreshTokens = new Map()

// --- Espace admin plateforme : identite et donnees entierement separees
// des commercants (`users`) ci-dessus. Aucun admin n'a de `businessId`.
const platformAdmins = []
const adminAuditLog = []
/** token -> adminId */
const adminAccessTokens = new Map()
/** token -> adminId */
const adminRefreshTokens = new Map()

/**
 * Table de correspondance role -> permissions, miroir cote serveur de
 * `src/constants/permission.constants.ts`. C'est ICI la source de verite :
 * les permissions frontend ne servent qu'a l'UX, la securite reelle est
 * appliquee par ce backend (verification `hasPermission` sur chaque route).
 */
const ROLE_PERMISSIONS = {
  owner: [
    'client:create',
    'client:read',
    'client:update',
    'client:delete',
    'product:create',
    'product:read',
    'product:update',
    'product:delete',
    'invoice:create',
    'invoice:read',
    'invoice:update',
    'invoice:delete',
    'payment:create',
    'payment:read',
    'dashboard:read',
    'report:read',
    'user:manage',
    'subscription:read',
    'subscription:manage',
    'settings:manage'
  ],
  admin: [
    'client:create',
    'client:read',
    'client:update',
    'client:delete',
    'product:create',
    'product:read',
    'product:update',
    'product:delete',
    'invoice:create',
    'invoice:read',
    'invoice:update',
    'invoice:delete',
    'payment:create',
    'payment:read',
    'dashboard:read',
    'report:read',
    'user:manage',
    'settings:manage'
  ],
  manager: [
    'client:create',
    'client:read',
    'client:update',
    'product:create',
    'product:read',
    'product:update',
    'invoice:create',
    'invoice:read',
    'invoice:update',
    'payment:create',
    'payment:read',
    'dashboard:read',
    'report:read'
  ],
  accountant: [
    'client:read',
    'product:read',
    'invoice:create',
    'invoice:read',
    'invoice:update',
    'payment:create',
    'payment:read',
    'dashboard:read',
    'report:read'
  ],
  cashier: ['client:read', 'product:read', 'invoice:read', 'payment:create', 'payment:read']
}

/** Roles attribuables via l'invitation / du changement de role. `owner` est exclu. */
const INVITABLE_ROLES = ['admin', 'manager', 'accountant', 'cashier']

const OWNER_PERMISSIONS = ROLE_PERMISSIONS.owner

/**
 * Catalogue des plans d'abonnement SaaS. `null` sur une limite signifie
 * "illimite". Aucune donnee bancaire ici : le choix d'un plan ne fait que
 * referencer un `planId`, le paiement reel restant entierement gere par le
 * futur backend de production (jamais par ce serveur factice ni par le
 * frontend).
 */
const SUBSCRIPTION_PLANS = [
  {
    id: 'plan-free',
    name: 'Free',
    description: 'Pour demarrer et decouvrir la facturation.',
    price: 0,
    billingCycle: 'monthly',
    features: ['Facturation de base', '1 utilisateur', 'Support par email'],
    limits: { maxInvoicesPerMonth: 10, maxClients: 5, maxUsers: 1 }
  },
  {
    id: 'plan-standard',
    name: 'Standard',
    description: 'Pour les commerces en croissance.',
    price: 15000,
    billingCycle: 'monthly',
    features: [
      "Jusqu'a 5 utilisateurs",
      'Rapports avances',
      'Suivi des paiements multiples',
      'Support prioritaire'
    ],
    limits: { maxInvoicesPerMonth: 100, maxClients: 100, maxUsers: 5 }
  },
  {
    id: 'plan-premium',
    name: 'Premium',
    description: 'Sans limites, pour les commerces etablis.',
    price: 35000,
    billingCycle: 'monthly',
    features: [
      'Utilisateurs illimites',
      'Clients et factures illimites',
      'Rapports avances',
      'Personnalisation de la facturation',
      'Support prioritaire 24/7'
    ],
    limits: { maxInvoicesPerMonth: null, maxClients: null, maxUsers: null }
  }
]

function resolvePlan(planId) {
  return SUBSCRIPTION_PLANS.find((p) => p.id === planId)
}

/** Bornes (ISO) de la periode d'abonnement en cours : du 1er du mois au 1er du mois suivant. */
function getCurrentPeriodBounds() {
  const start = new Date()
  start.setDate(1)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setMonth(end.getMonth() + 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

/** Cree l'abonnement par defaut d'un commerce nouvellement cree (plan Free, essai de 14 jours). */
function createDefaultSubscription(businessId) {
  const start = new Date()
  const trialEnd = new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000)
  const record = {
    id: crypto.randomUUID(),
    businessId,
    planId: 'plan-free',
    status: 'trial',
    currentPeriodStart: start.toISOString(),
    currentPeriodEnd: trialEnd.toISOString(),
    cancelAtPeriodEnd: false,
    createdAt: now(),
    updatedAt: now()
  }
  subscriptions.push(record)
  return record
}

/** Utilisation courante d'un commerce par rapport aux limites de son plan. */
function computeSubscriptionUsage(businessId, periodStart) {
  return {
    invoicesThisPeriod: invoices.filter(
      (i) => i.businessId === businessId && i.createdAt >= periodStart
    ).length,
    clientsCount: clients.filter((c) => c.businessId === businessId).length,
    usersCount: users.filter((u) => u.businessId === businessId).length
  }
}

function serializeSubscription(record) {
  return {
    id: record.id,
    businessId: record.businessId,
    plan: resolvePlan(record.planId),
    status: record.status,
    currentPeriodStart: record.currentPeriodStart,
    currentPeriodEnd: record.currentPeriodEnd,
    cancelAtPeriodEnd: record.cancelAtPeriodEnd,
    usage: computeSubscriptionUsage(record.businessId, record.currentPeriodStart),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  }
}

function now() {
  return new Date().toISOString()
}

/** Configuration de facturation par defaut d'un commerce nouvellement cree. */
function defaultInvoiceSettings() {
  return {
    numberPrefix: 'FA-',
    nextNumber: 1,
    numberPadding: 4,
    defaultPaymentTermDays: 30,
    paymentTerms: 'Paiement a reception de facture.'
  }
}

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function issueTokens(userId) {
  const accessToken = crypto.randomUUID()
  const refreshToken = crypto.randomUUID()
  accessTokens.set(accessToken, userId)
  refreshTokens.set(refreshToken, userId)
  return { accessToken, refreshToken }
}

function publicUser(user) {
  const { password, ...rest } = user
  return rest
}

// --- Semis de donnees ---------------------------------------------------

function seedAccount({ email, password, businessName, seedSampleData }) {
  const businessId = crypto.randomUUID()
  const userId = crypto.randomUUID()

  businesses.push({
    id: businessId,
    name: businessName,
    businessType: 'boutique',
    email: `contact@${businessName.toLowerCase().replace(/\s+/g, '-')}.test`,
    phone: '+225 07 00 00 00 00',
    address: "Abidjan, Cote d'Ivoire",
    city: 'Abidjan',
    country: "Cote d'Ivoire",
    taxId: undefined,
    logoUrl: undefined,
    currency: 'XOF',
    timezone: 'Africa/Abidjan',
    vatEnabled: true,
    defaultVatRate: 18,
    invoiceSettings: defaultInvoiceSettings(),
    isSuspended: false,
    createdAt: now(),
    updatedAt: now()
  })

  users.push({
    id: userId,
    businessId,
    firstName: 'AZANKPO',
    lastName: 'Erik',
    email,
    password,
    phone: undefined,
    role: 'owner',
    permissions: OWNER_PERMISSIONS,
    avatarUrl: undefined,
    isActive: true,
    lastLoginAt: undefined,
    createdAt: now(),
    updatedAt: now()
  })

  // Abonnement du compte de demo : plan Free deja "actif" (pas en essai, pour
  // coller a l'anciennete simulee du commerce), sur la periode calendaire en
  // cours. Volontairement proche des limites (voir seedSampleData_) pour
  // illustrer l'alerte de rapprochement de limite des la premiere connexion.
  const demoPeriod = getCurrentPeriodBounds()
  subscriptions.push({
    id: crypto.randomUUID(),
    businessId,
    planId: 'plan-free',
    status: 'active',
    currentPeriodStart: demoPeriod.start,
    currentPeriodEnd: demoPeriod.end,
    cancelAtPeriodEnd: false,
    createdAt: now(),
    updatedAt: now()
  })

  if (seedSampleData) {
    seedSampleData_(businessId)
  }

  return businessId
}

function logActivity(businessId, type, message, createdAt) {
  activities.push({ id: crypto.randomUUID(), businessId, type, message, createdAt })
}

function seedSampleData_(businessId) {
  const clientSpecs = [
    { firstName: 'Fatou', lastName: 'Diarra', city: 'Abidjan', country: "Cote d'Ivoire" },
    { firstName: 'Jean', lastName: 'Kouadio', city: 'Bouake', country: "Cote d'Ivoire" },
    { firstName: 'Awa', lastName: 'Traore', city: 'Abidjan', country: "Cote d'Ivoire", taxId: 'CI-TAX-4821' },
    { firstName: 'Moussa', lastName: 'Kone', city: 'Yamoussoukro', country: "Cote d'Ivoire" }
  ]
  const seededClients = clientSpecs.map((spec, index) => {
    const fullName = `${spec.firstName} ${spec.lastName}`
    const client = {
      id: crypto.randomUUID(),
      businessId,
      firstName: spec.firstName,
      lastName: spec.lastName,
      email: `${fullName.toLowerCase().replace(/\s+/g, '.')}@example.test`,
      phone: '+225 07 0' + index + ' 00 00 00',
      address: undefined,
      city: spec.city,
      country: spec.country,
      taxId: spec.taxId,
      createdAt: daysAgo(340 - index * 10).toISOString(),
      updatedAt: now()
    }
    clients.push(client)
    logActivity(businessId, 'client_created', `Nouveau client ajoute : ${fullName}`, client.createdAt)
    return client
  })

  const productSpecs = [
    { name: 'T-shirt coton', category: 'Vetements', type: 'product', price: 8000, stock: 42 },
    { name: 'Robe wax', category: 'Vetements', type: 'product', price: 25000, stock: 15 },
    { name: 'Sac a main', category: 'Accessoires', type: 'product', price: 18000, stock: 8 },
    { name: 'Chaussures cuir', category: 'Accessoires', type: 'product', price: 32000, stock: 5 },
    { name: 'Retouche vetement', category: 'Services', type: 'service', price: 6000 }
  ]
  const seededProducts = productSpecs.map((spec, index) => {
    const product = {
      id: crypto.randomUUID(),
      businessId,
      name: spec.name,
      description: undefined,
      category: spec.category,
      type: spec.type,
      sku: spec.type === 'product' ? `SKU-${index + 1}` : undefined,
      price: spec.price,
      taxRate: 18,
      stock: spec.type === 'product' ? spec.stock : undefined,
      createdAt: daysAgo(350 - index * 8).toISOString(),
      updatedAt: now()
    }
    products.push(product)
    logActivity(
      businessId,
      'product_created',
      `Nouveau produit ajoute : ${product.name}`,
      product.createdAt
    )
    return product
  })

  const PAYMENT_METHODS = ['cash', 'card', 'bank_transfer', 'mobile_money']

  // daysAgo / statut / montant total / part payee / moyen de paiement.
  const invoiceSpecs = [
    { daysAgo: 0, status: 'sent', total: 45000, paidRatio: 0 },
    { daysAgo: 1, status: 'paid', total: 32000, paidRatio: 1, method: 'mobile_money' },
    { daysAgo: 2, status: 'draft', total: 12000, paidRatio: 0 },
    { daysAgo: 5, status: 'paid', total: 78000, paidRatio: 1, method: 'card' },
    { daysAgo: 9, status: 'partially_paid', total: 60000, paidRatio: 0.5, method: 'cash' },
    { daysAgo: 15, status: 'overdue', total: 25000, paidRatio: 0 },
    { daysAgo: 20, status: 'paid', total: 90000, paidRatio: 1, method: 'bank_transfer' },
    { daysAgo: 28, status: 'paid', total: 41000, paidRatio: 1, method: 'mobile_money' },
    { daysAgo: 40, status: 'paid', total: 55000, paidRatio: 1, method: 'card' },
    { daysAgo: 60, status: 'overdue', total: 18000, paidRatio: 0 },
    { daysAgo: 75, status: 'paid', total: 63000, paidRatio: 1, method: 'cash' },
    { daysAgo: 110, status: 'paid', total: 72000, paidRatio: 1, method: 'mobile_money' },
    { daysAgo: 200, status: 'cancelled', total: 15000, paidRatio: 0 },
    { daysAgo: 300, status: 'paid', total: 88000, paidRatio: 1, method: 'bank_transfer' }
  ]

  invoiceSpecs.forEach((spec, index) => {
    const issueDate = daysAgo(spec.daysAgo)
    const dueDate = new Date(issueDate.getTime() + 14 * 24 * 60 * 60 * 1000)
    const client = seededClients[index % seededClients.length]
    const clientName = `${client.firstName} ${client.lastName}`
    const product = seededProducts[index % seededProducts.length]
    const amountPaid = Math.round(spec.total * spec.paidRatio)

    const invoice = {
      id: crypto.randomUUID(),
      businessId,
      clientId: client.id,
      number: `FA-${String(invoiceSpecs.length - index).padStart(4, '0')}`,
      status: spec.status,
      issueDate: issueDate.toISOString(),
      dueDate: dueDate.toISOString(),
      items: [
        {
          id: crypto.randomUUID(),
          productId: product.id,
          description: product.name,
          quantity: 1,
          unitPrice: spec.total,
          taxRate: 0,
          total: spec.total
        }
      ],
      discountType: 'percentage',
      discountValue: 0,
      discountAmount: 0,
      subtotal: spec.total,
      taxTotal: 0,
      total: spec.total,
      amountPaid,
      notes: undefined,
      createdAt: issueDate.toISOString(),
      updatedAt: now()
    }
    invoices.push(invoice)
    logActivity(
      businessId,
      'invoice_created',
      `Facture ${invoice.number} creee (${clientName})`,
      invoice.createdAt
    )

    if (spec.status !== 'draft') {
      logActivity(
        businessId,
        'invoice_sent',
        `Facture ${invoice.number} envoyee a ${clientName}`,
        issueDate.toISOString()
      )
    }

    if (amountPaid > 0) {
      const paidAt = new Date(issueDate.getTime() + 2 * 60 * 60 * 1000)
      const method = spec.method || PAYMENT_METHODS[index % PAYMENT_METHODS.length]
      const payment = {
        id: crypto.randomUUID(),
        businessId,
        invoiceId: invoice.id,
        amount: amountPaid,
        method,
        status: 'completed',
        reference: undefined,
        paidAt: paidAt.toISOString(),
        notes: undefined,
        createdAt: paidAt.toISOString(),
        updatedAt: now()
      }
      payments.push(payment)
      logActivity(
        businessId,
        'payment_received',
        `Paiement de ${amountPaid.toLocaleString('fr-FR')} XOF recu pour ${invoice.number}`,
        payment.createdAt
      )
    }
  })

  // Les factures de demonstration ci-dessus utilisent une numerotation
  // dediee (index decroissant) : on aligne le compteur de la config de
  // facturation pour que la prochaine facture creee "pour de vrai"
  // poursuive la sequence sans collision.
  const seededBusiness = businesses.find((b) => b.id === businessId)
  if (seededBusiness) {
    seededBusiness.invoiceSettings.nextNumber = invoiceSpecs.length + 1
  }
}

seedAccount({
  email: 'demo@facture-ia.com',
  password: 'password123',
  businessName: 'Ma Boutique Demo',
  seedSampleData: true
})

// Second commerce de demo, plus modeste, pour que l'espace admin ait
// plusieurs commerces distincts a lister/comparer des le depart.
seedAccount({
  email: 'demo2@facture-ia.com',
  password: 'password123',
  businessName: 'Salon Beaute Demo',
  seedSampleData: false
})

// Compte administrateur plateforme de demo.
platformAdmins.push({
  id: crypto.randomUUID(),
  firstName: 'Admin',
  lastName: 'Plateforme',
  email: 'admin@facture-ia.com',
  password: 'admin123',
  isActive: true,
  createdAt: now(),
  updatedAt: now()
})

// --- Helpers de reponse -----------------------------------------------------

function ok(res, data, message) {
  res.json({ success: true, data, ...(message ? { message } : {}) })
}

function respondPaginated(res, req, items, defaultSortKey = 'createdAt') {
  const sortBy = typeof req.query.sortBy === 'string' ? req.query.sortBy : defaultSortKey
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1

  const sorted = [...items].sort((a, b) => {
    const left = a[sortBy]
    const right = b[sortBy]
    if (left === right) return 0
    return left > right ? sortOrder : -sortOrder
  })

  const page = Math.max(1, Number(req.query.page) || 1)
  const perPage = Math.max(1, Number(req.query.perPage) || 20)
  const start = (page - 1) * perPage
  const pageItems = sorted.slice(start, start + perPage)

  res.json({
    success: true,
    data: pageItems,
    meta: {
      page,
      perPage,
      total: sorted.length,
      totalPages: Math.max(1, Math.ceil(sorted.length / perPage))
    }
  })
}

function fail(res, status, code, message) {
  res.status(status).json({ success: false, code, message })
}

// --- Middleware d'authentification ------------------------------------------

function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  const userId = token ? accessTokens.get(token) : null

  if (!userId) {
    fail(res, 401, 'UNAUTHORIZED', 'Session expiree ou invalide.')
    return
  }

  const user = users.find((u) => u.id === userId)
  if (!user) {
    fail(res, 401, 'UNAUTHORIZED', 'Utilisateur introuvable.')
    return
  }

  req.currentUser = user
  req.currentBusiness = businesses.find((b) => b.id === user.businessId)

  // Un commerce suspendu par un admin plateforme perd immediatement l'acces
  // a l'API, quel que soit l'utilisateur qui essaie de s'y connecter.
  if (req.currentBusiness && req.currentBusiness.isSuspended) {
    fail(
      res,
      403,
      'BUSINESS_SUSPENDED',
      'Ce commerce a ete suspendu. Contactez le support pour plus d\'informations.'
    )
    return
  }

  next()
}

/**
 * Middleware d'authentification de l'espace admin plateforme. Realm
 * entierement separe de `requireAuth` (jetons distincts, table d'identite
 * distincte) : un jeton commercant ne fonctionne jamais sur une route
 * `/admin/*`, et reciproquement.
 */
function requireAdminAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  const adminId = token ? adminAccessTokens.get(token) : null

  if (!adminId) {
    fail(res, 401, 'UNAUTHORIZED', 'Session administrateur expiree ou invalide.')
    return
  }

  const admin = platformAdmins.find((a) => a.id === adminId)
  if (!admin || !admin.isActive) {
    fail(res, 401, 'UNAUTHORIZED', 'Administrateur introuvable ou desactive.')
    return
  }

  req.currentAdmin = admin
  next()
}

// --- Auth ---------------------------------------------------------------

app.post('/api/v1/auth/register', (req, res) => {
  const { businessName, businessType, firstName, lastName, email, password } = req.body || {}

  if (!businessName || !firstName || !lastName || !email || !password) {
    fail(res, 422, 'VALIDATION_ERROR', 'Champs requis manquants.')
    return
  }
  if (users.some((u) => u.email.toLowerCase() === String(email).toLowerCase())) {
    fail(res, 409, 'EMAIL_TAKEN', 'Un compte existe deja avec cet email.')
    return
  }

  const businessId = crypto.randomUUID()
  const userId = crypto.randomUUID()

  const business = {
    id: businessId,
    name: businessName,
    businessType: businessType || 'pme',
    email,
    phone: undefined,
    address: undefined,
    city: undefined,
    country: undefined,
    taxId: undefined,
    logoUrl: undefined,
    currency: 'XOF',
    timezone: 'Africa/Abidjan',
    vatEnabled: true,
    defaultVatRate: 18,
    invoiceSettings: defaultInvoiceSettings(),
    isSuspended: false,
    createdAt: now(),
    updatedAt: now()
  }
  businesses.push(business)

  const user = {
    id: userId,
    businessId,
    firstName,
    lastName,
    email,
    password,
    phone: undefined,
    role: 'owner',
    permissions: OWNER_PERMISSIONS,
    avatarUrl: undefined,
    isActive: true,
    lastLoginAt: now(),
    createdAt: now(),
    updatedAt: now()
  }
  users.push(user)

  // Un compte nouvellement inscrit demarre vide : c'est le chemin qui
  // exerce l'etat "absence de donnees" du tableau de bord.

  // Chaque nouveau commerce demarre avec un essai gratuit de 14 jours sur le
  // plan Free (voir `createDefaultSubscription`). Aucune donnee bancaire
  // n'est demandee ici : le choix effectif d'un plan payant se fait plus
  // tard, depuis la page Abonnement.
  createDefaultSubscription(businessId)

  const tokens = issueTokens(userId)
  ok(res, { user: publicUser(user), business, tokens })
})

app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body || {}
  const user = users.find((u) => u.email.toLowerCase() === String(email || '').toLowerCase())

  if (!user || user.password !== password) {
    fail(res, 401, 'INVALID_CREDENTIALS', 'Email ou mot de passe incorrect.')
    return
  }

  const business = businesses.find((b) => b.id === user.businessId)

  // Rejette la connexion tout de suite plutot que de laisser l'utilisateur
  // atterrir sur un tableau de bord ou chaque appel echouerait en 403.
  if (business && business.isSuspended) {
    fail(
      res,
      403,
      'BUSINESS_SUSPENDED',
      'Ce commerce a ete suspendu. Contactez le support pour plus d\'informations.'
    )
    return
  }

  user.lastLoginAt = now()
  const tokens = issueTokens(user.id)
  ok(res, { user: publicUser(user), business, tokens })
})

app.post('/api/v1/auth/logout', requireAuth, (req, res) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (token) accessTokens.delete(token)
  ok(res, null)
})

app.get('/api/v1/auth/me', requireAuth, (req, res) => {
  ok(res, { user: publicUser(req.currentUser), business: req.currentBusiness })
})

app.post('/api/v1/auth/refresh', (req, res) => {
  const { refreshToken } = req.body || {}
  const userId = refreshToken ? refreshTokens.get(refreshToken) : null

  if (!userId) {
    fail(res, 401, 'INVALID_REFRESH_TOKEN', 'Jeton de rafraichissement invalide.')
    return
  }

  refreshTokens.delete(refreshToken)
  const tokens = issueTokens(userId)
  ok(res, tokens)
})

app.post('/api/v1/auth/forgot-password', (req, res) => {
  // Toujours un succes (ne revele pas si l'email existe), comme un vrai backend.
  ok(res, null)
})

app.post('/api/v1/auth/reset-password', (req, res) => {
  const { token, password } = req.body || {}
  if (!token || !password) {
    fail(res, 422, 'VALIDATION_ERROR', 'Jeton et mot de passe requis.')
    return
  }
  ok(res, null)
})

app.post('/api/v1/auth/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body || {}
  if (req.currentUser.password !== currentPassword) {
    fail(res, 401, 'INVALID_PASSWORD', 'Mot de passe actuel incorrect.')
    return
  }
  req.currentUser.password = newPassword
  ok(res, null)
})

// --- Clients --------------------------------------------------------------

function matchesSearch(client, search) {
  if (!search) return true
  const needle = search.toLowerCase()
  return [client.firstName, client.lastName, client.email, client.phone]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(needle))
}

function validateClientPayload(payload, { partial }) {
  const errors = {}
  const hasFirstName = Object.prototype.hasOwnProperty.call(payload, 'firstName')
  const hasLastName = Object.prototype.hasOwnProperty.call(payload, 'lastName')

  if ((!partial || hasFirstName) && !String(payload.firstName || '').trim()) {
    errors.firstName = ['Le prenom est requis.']
  }
  if ((!partial || hasLastName) && !String(payload.lastName || '').trim()) {
    errors.lastName = ['Le nom est requis.']
  }
  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    errors.email = ["Le format de l'email est invalide."]
  }
  return errors
}

function findClient(req) {
  return clients.find((c) => c.id === req.params.id && c.businessId === req.currentBusiness.id)
}

app.get('/api/v1/clients', requireAuth, (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search : ''
  const businessClients = clients.filter(
    (c) => c.businessId === req.currentBusiness.id && matchesSearch(c, search)
  )
  respondPaginated(res, req, businessClients, 'lastName')
})

app.get('/api/v1/clients/:id', requireAuth, (req, res) => {
  const client = findClient(req)
  if (!client) {
    fail(res, 404, 'NOT_FOUND', 'Client introuvable.')
    return
  }
  ok(res, client)
})

app.post('/api/v1/clients', requireAuth, (req, res) => {
  const payload = req.body || {}
  const errors = validateClientPayload(payload, { partial: false })
  if (Object.keys(errors).length > 0) {
    res
      .status(422)
      .json({ success: false, code: 'VALIDATION_ERROR', message: 'Donnees invalides.', errors })
    return
  }

  const client = {
    id: crypto.randomUUID(),
    businessId: req.currentBusiness.id,
    firstName: payload.firstName.trim(),
    lastName: payload.lastName.trim(),
    phone: payload.phone || undefined,
    email: payload.email || undefined,
    address: payload.address || undefined,
    city: payload.city || undefined,
    country: payload.country || undefined,
    taxId: payload.taxId || undefined,
    createdAt: now(),
    updatedAt: now()
  }
  clients.push(client)
  logActivity(
    req.currentBusiness.id,
    'client_created',
    `Nouveau client ajoute : ${client.firstName} ${client.lastName}`,
    client.createdAt
  )
  ok(res, client)
})

app.patch('/api/v1/clients/:id', requireAuth, (req, res) => {
  const client = findClient(req)
  if (!client) {
    fail(res, 404, 'NOT_FOUND', 'Client introuvable.')
    return
  }

  const payload = req.body || {}
  const errors = validateClientPayload(payload, { partial: true })
  if (Object.keys(errors).length > 0) {
    res
      .status(422)
      .json({ success: false, code: 'VALIDATION_ERROR', message: 'Donnees invalides.', errors })
    return
  }

  Object.assign(client, payload, { updatedAt: now() })
  ok(res, client)
})

app.delete('/api/v1/clients/:id', requireAuth, (req, res) => {
  const index = clients.findIndex(
    (c) => c.id === req.params.id && c.businessId === req.currentBusiness.id
  )
  if (index === -1) {
    fail(res, 404, 'NOT_FOUND', 'Client introuvable.')
    return
  }
  clients.splice(index, 1)
  ok(res, null)
})

// --- Produits / services ----------------------------------------------

function matchesProductSearch(product, search) {
  if (!search) return true
  const needle = search.toLowerCase()
  return [product.name, product.category, product.sku]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(needle))
}

function validateProductPayload(payload, { partial }) {
  const errors = {}
  const has = (key) => Object.prototype.hasOwnProperty.call(payload, key)

  if ((!partial || has('name')) && !String(payload.name || '').trim()) {
    errors.name = ['Le nom est requis.']
  }
  if ((!partial || has('category')) && !String(payload.category || '').trim()) {
    errors.category = ['La categorie est requise.']
  }
  if (has('type') && !['product', 'service'].includes(payload.type)) {
    errors.type = ['Le type doit etre "product" ou "service".']
  }
  if (!partial || has('price')) {
    const price = Number(payload.price)
    if (!Number.isFinite(price) || price <= 0) {
      errors.price = ['Le prix doit etre un nombre positif.']
    }
  }
  if (has('taxRate') && payload.taxRate !== undefined) {
    const taxRate = Number(payload.taxRate)
    if (!Number.isFinite(taxRate) || taxRate < 0) {
      errors.taxRate = ['La TVA doit etre un nombre positif ou nul.']
    }
  }
  if (has('stock') && payload.stock !== undefined) {
    const stock = Number(payload.stock)
    if (!Number.isFinite(stock) || stock < 0) {
      errors.stock = ['Le stock doit etre un nombre positif ou nul.']
    }
  }
  return errors
}

function findProduct(req) {
  return products.find((p) => p.id === req.params.id && p.businessId === req.currentBusiness.id)
}

app.get('/api/v1/products', requireAuth, (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search : ''
  const businessProducts = products.filter(
    (p) => p.businessId === req.currentBusiness.id && matchesProductSearch(p, search)
  )
  respondPaginated(res, req, businessProducts, 'name')
})

app.get('/api/v1/products/:id', requireAuth, (req, res) => {
  const product = findProduct(req)
  if (!product) {
    fail(res, 404, 'NOT_FOUND', 'Produit introuvable.')
    return
  }
  ok(res, product)
})

app.post('/api/v1/products', requireAuth, (req, res) => {
  const payload = req.body || {}
  const errors = validateProductPayload(payload, { partial: false })
  if (Object.keys(errors).length > 0) {
    res
      .status(422)
      .json({ success: false, code: 'VALIDATION_ERROR', message: 'Donnees invalides.', errors })
    return
  }

  const type = payload.type === 'service' ? 'service' : 'product'
  const product = {
    id: crypto.randomUUID(),
    businessId: req.currentBusiness.id,
    name: String(payload.name).trim(),
    description: payload.description || undefined,
    category: String(payload.category).trim(),
    type,
    price: Number(payload.price),
    taxRate: payload.taxRate !== undefined ? Number(payload.taxRate) : 0,
    sku: payload.sku || undefined,
    stock: type === 'product' && payload.stock !== undefined ? Number(payload.stock) : undefined,
    createdAt: now(),
    updatedAt: now()
  }
  products.push(product)
  logActivity(
    req.currentBusiness.id,
    'product_created',
    `Nouveau produit ajoute : ${product.name}`,
    product.createdAt
  )
  ok(res, product)
})

app.patch('/api/v1/products/:id', requireAuth, (req, res) => {
  const product = findProduct(req)
  if (!product) {
    fail(res, 404, 'NOT_FOUND', 'Produit introuvable.')
    return
  }

  const payload = req.body || {}
  const errors = validateProductPayload(payload, { partial: true })
  if (Object.keys(errors).length > 0) {
    res
      .status(422)
      .json({ success: false, code: 'VALIDATION_ERROR', message: 'Donnees invalides.', errors })
    return
  }

  const next = { ...payload }
  if (next.price !== undefined) next.price = Number(next.price)
  if (next.taxRate !== undefined) next.taxRate = Number(next.taxRate)
  if (next.stock !== undefined) next.stock = Number(next.stock)
  if ((next.type ?? product.type) === 'service') next.stock = undefined

  Object.assign(product, next, { updatedAt: now() })
  ok(res, product)
})

app.delete('/api/v1/products/:id', requireAuth, (req, res) => {
  const index = products.findIndex(
    (p) => p.id === req.params.id && p.businessId === req.currentBusiness.id
  )
  if (index === -1) {
    fail(res, 404, 'NOT_FOUND', 'Produit introuvable.')
    return
  }
  products.splice(index, 1)
  ok(res, null)
})

// --- Factures ---------------------------------------------------------

/** Miroir de `utils/invoiceCalculations.ts` cote frontend (voir ce fichier
 * pour le detail du raisonnement : remise repartie au prorata avant TVA). */
function computeInvoiceTotals(items, discountType, discountValue) {
  const round = (value) => Math.round((value + Number.EPSILON) * 100) / 100
  const lineTotal = (item) => round((item.quantity || 0) * (item.unitPrice || 0))

  const subtotal = round(items.reduce((sum, item) => sum + lineTotal(item), 0))
  const rawDiscount =
    discountType === 'percentage' ? subtotal * ((discountValue || 0) / 100) : discountValue || 0
  const discountAmount =
    subtotal > 0 && rawDiscount > 0 ? round(Math.min(Math.max(rawDiscount, 0), subtotal)) : 0
  const discountRatio = subtotal > 0 ? discountAmount / subtotal : 0

  const taxTotal = round(
    items.reduce((sum, item) => {
      const taxableLineAmount = lineTotal(item) * (1 - discountRatio)
      return sum + taxableLineAmount * ((item.taxRate || 0) / 100)
    }, 0)
  )

  const taxableAmount = round(subtotal - discountAmount)
  const total = round(taxableAmount + taxTotal)

  return { discountAmount, subtotal, taxTotal, total }
}

function validateInvoicePayload(payload) {
  const errors = {}
  const status = payload.status === 'draft' ? 'draft' : 'sent'

  if (!payload.clientId) errors.clientId = ['Le client est requis.']

  if (status !== 'draft') {
    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      errors.items = ['Au moins une ligne est requise.']
    } else if (
      payload.items.some(
        (item) =>
          !String(item.description || '').trim() ||
          !(Number(item.quantity) > 0) ||
          !(Number(item.unitPrice) >= 0)
      )
    ) {
      errors.items = [
        'Chaque ligne doit avoir une description, une quantite positive et un prix valide.'
      ]
    }
  }

  if (payload.discountType && !['percentage', 'fixed'].includes(payload.discountType)) {
    errors.discountType = ['Type de remise invalide.']
  }
  if (payload.discountValue !== undefined && !(Number(payload.discountValue) >= 0)) {
    errors.discountValue = ['La remise doit etre un nombre positif ou nul.']
  }

  return errors
}

/**
 * Enrichit une facture avec `clientName`, donnee de confort pour
 * l'affichage en liste/detail (la relation reste `clientId`).
 */
function withClientName(invoice) {
  const client = clients.find((c) => c.id === invoice.clientId)
  return { ...invoice, clientName: client ? `${client.firstName} ${client.lastName}` : undefined }
}

/** Genere un PDF minimal (texte simple) representant la facture, sans dependance externe. */
function buildInvoicePdfBuffer(lines) {
  const encode = (s) => Buffer.from(s, 'latin1')
  const sanitize = (s) =>
    String(s)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[()\\]/g, (m) => '\\' + m)

  let y = 760
  const streamParts = lines.map((line, index) => {
    const size = index === 0 ? 16 : 11
    const part = `BT /F1 ${size} Tf 50 ${y} Td (${sanitize(line)}) Tj ET`
    y -= index === 0 ? 28 : 18
    return part
  })
  const streamBuf = encode(streamParts.join('\n'))

  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
  ]

  const chunks = [encode('%PDF-1.4\n')]
  const offsets = []
  let pos = chunks[0].length

  for (let i = 0; i < objs.length; i++) {
    offsets.push(pos)
    const chunk = encode(`${i + 1} 0 obj\n${objs[i]}\nendobj\n`)
    chunks.push(chunk)
    pos += chunk.length
  }

  offsets.push(pos)
  const streamHeader = encode(`5 0 obj\n<< /Length ${streamBuf.length} >>\nstream\n`)
  const streamFooter = encode('\nendstream\nendobj\n')
  chunks.push(streamHeader, streamBuf, streamFooter)
  pos += streamHeader.length + streamBuf.length + streamFooter.length

  const xrefOffset = pos
  let xref = 'xref\n0 6\n0000000000 65535 f \n'
  for (let i = 0; i < 5; i++) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }
  xref += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  chunks.push(encode(xref))

  return Buffer.concat(chunks)
}

app.get('/api/v1/invoices', requireAuth, (req, res) => {
  let businessInvoices = invoices.filter((i) => i.businessId === req.currentBusiness.id)

  const search = typeof req.query.search === 'string' ? req.query.search.toLowerCase() : ''
  if (search) {
    businessInvoices = businessInvoices.filter((invoice) => {
      const client = clients.find((c) => c.id === invoice.clientId)
      const clientName = client ? `${client.firstName} ${client.lastName}`.toLowerCase() : ''
      return invoice.number.toLowerCase().includes(search) || clientName.includes(search)
    })
  }
  if (req.query.status) {
    businessInvoices = businessInvoices.filter((i) => i.status === req.query.status)
  }
  if (req.query.clientId) {
    businessInvoices = businessInvoices.filter((i) => i.clientId === req.query.clientId)
  }
  if (req.query.dateFrom) {
    businessInvoices = businessInvoices.filter((i) => i.issueDate >= req.query.dateFrom)
  }
  if (req.query.dateTo) {
    businessInvoices = businessInvoices.filter((i) => i.issueDate <= req.query.dateTo)
  }
  if (req.query.amountMin) {
    businessInvoices = businessInvoices.filter((i) => i.total >= Number(req.query.amountMin))
  }
  if (req.query.amountMax) {
    businessInvoices = businessInvoices.filter((i) => i.total <= Number(req.query.amountMax))
  }

  respondPaginated(res, req, businessInvoices.map(withClientName), 'issueDate')
})

app.get('/api/v1/invoices/:id', requireAuth, (req, res) => {
  const invoice = invoices.find(
    (i) => i.id === req.params.id && i.businessId === req.currentBusiness.id
  )
  if (!invoice) {
    fail(res, 404, 'NOT_FOUND', 'Facture introuvable.')
    return
  }
  ok(res, withClientName(invoice))
})

app.get('/api/v1/invoices/:id/pdf', requireAuth, (req, res) => {
  const invoice = invoices.find(
    (i) => i.id === req.params.id && i.businessId === req.currentBusiness.id
  )
  if (!invoice) {
    fail(res, 404, 'NOT_FOUND', 'Facture introuvable.')
    return
  }
  const client = clients.find((c) => c.id === invoice.clientId)
  const business = req.currentBusiness
  const currency = business.currency || ''

  const lines = [
    `Facture ${invoice.number}`,
    business.name,
    `Client: ${client ? `${client.firstName} ${client.lastName}` : 'N/A'}`,
    `Date d'emission: ${invoice.issueDate.slice(0, 10)}`,
    `Date d'echeance: ${invoice.dueDate.slice(0, 10)}`,
    '',
    ...invoice.items.map(
      (item) =>
        `${item.description}  x${item.quantity}  ${item.unitPrice} ${currency} = ${item.total} ${currency}`
    ),
    '',
    `Sous-total: ${invoice.subtotal} ${currency}`,
    `Remise: ${invoice.discountAmount} ${currency}`,
    `TVA: ${invoice.taxTotal} ${currency}`,
    `Total: ${invoice.total} ${currency}`,
    `Paye: ${invoice.amountPaid} ${currency}`
  ]

  const pdfBuffer = buildInvoicePdfBuffer(lines)
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${invoice.number}.pdf"`)
  res.send(pdfBuffer)
})

app.post('/api/v1/invoices', requireAuth, (req, res) => {
  const payload = req.body || {}
  const errors = validateInvoicePayload(payload)
  if (Object.keys(errors).length > 0) {
    res
      .status(422)
      .json({ success: false, code: 'VALIDATION_ERROR', message: 'Donnees invalides.', errors })
    return
  }

  const client = clients.find(
    (c) => c.id === payload.clientId && c.businessId === req.currentBusiness.id
  )
  if (!client) {
    res.status(422).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Donnees invalides.',
      errors: { clientId: ['Client introuvable.'] }
    })
    return
  }

  const status = payload.status === 'draft' ? 'draft' : 'sent'
  const discountType = payload.discountType === 'fixed' ? 'fixed' : 'percentage'
  const discountValue = Number(payload.discountValue) || 0

  const items = (payload.items || []).map((item) => {
    const quantity = Number(item.quantity) || 0
    const unitPrice = Number(item.unitPrice) || 0
    return {
      id: crypto.randomUUID(),
      productId: item.productId || undefined,
      description: String(item.description || '').trim(),
      quantity,
      unitPrice,
      taxRate: Number(item.taxRate) || 0,
      total: Math.round(quantity * unitPrice * 100) / 100
    }
  })
  const totals = computeInvoiceTotals(items, discountType, discountValue)

  // Numerotation pilotee par les parametres du commerce (voir la section
  // "Configuration des factures" > "Numerotation" des parametres) : le
  // compteur `nextNumber` est incremente et persiste a chaque facture creee.
  const invoiceSettings = req.currentBusiness.invoiceSettings
  const sequenceNumber = invoiceSettings.nextNumber
  const number = `${invoiceSettings.numberPrefix}${String(sequenceNumber).padStart(invoiceSettings.numberPadding, '0')}`
  invoiceSettings.nextNumber = sequenceNumber + 1

  const issueDate = payload.issueDate || now()
  // A defaut de date d'echeance fournie, on applique le delai de paiement
  // par defaut configure dans les parametres du commerce.
  const dueDate =
    payload.dueDate ||
    new Date(
      new Date(issueDate).getTime() + invoiceSettings.defaultPaymentTermDays * 24 * 60 * 60 * 1000
    ).toISOString()

  const invoice = {
    id: crypto.randomUUID(),
    businessId: req.currentBusiness.id,
    clientId: client.id,
    number,
    status,
    issueDate,
    dueDate,
    items,
    discountType,
    discountValue,
    discountAmount: totals.discountAmount,
    subtotal: totals.subtotal,
    taxTotal: totals.taxTotal,
    total: totals.total,
    amountPaid: 0,
    notes: payload.notes || undefined,
    createdAt: now(),
    updatedAt: now()
  }
  invoices.push(invoice)

  const clientName = `${client.firstName} ${client.lastName}`
  logActivity(
    req.currentBusiness.id,
    'invoice_created',
    `Facture ${invoice.number} creee (${clientName})`,
    invoice.createdAt
  )
  if (status !== 'draft') {
    logActivity(
      req.currentBusiness.id,
      'invoice_sent',
      `Facture ${invoice.number} envoyee a ${clientName}`,
      invoice.createdAt
    )
  }

  ok(res, withClientName(invoice))
})

app.patch('/api/v1/invoices/:id', requireAuth, (req, res) => {
  const invoice = invoices.find(
    (i) => i.id === req.params.id && i.businessId === req.currentBusiness.id
  )
  if (!invoice) {
    fail(res, 404, 'NOT_FOUND', 'Facture introuvable.')
    return
  }

  const payload = req.body || {}

  if (payload.status === 'cancelled' && ['paid', 'cancelled'].includes(invoice.status)) {
    res.status(422).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Cette facture ne peut plus etre annulee.',
      errors: {}
    })
    return
  }

  // Seule une facture en brouillon accepte une modification en profondeur
  // (lignes, remise) : une fois envoyee, l'historique n'est plus reecrit.
  const isContentUpdate =
    payload.items !== undefined ||
    payload.discountType !== undefined ||
    payload.discountValue !== undefined
  if (isContentUpdate && invoice.status !== 'draft') {
    res.status(422).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Seule une facture en brouillon peut etre modifiee en detail.',
      errors: {}
    })
    return
  }

  if (payload.clientId) {
    const client = clients.find(
      (c) => c.id === payload.clientId && c.businessId === req.currentBusiness.id
    )
    if (!client) {
      res.status(422).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Donnees invalides.',
        errors: { clientId: ['Client introuvable.'] }
      })
      return
    }
    invoice.clientId = client.id
  }

  if (isContentUpdate) {
    const errors = validateInvoicePayload({ ...invoice, ...payload })
    if (Object.keys(errors).length > 0) {
      res
        .status(422)
        .json({ success: false, code: 'VALIDATION_ERROR', message: 'Donnees invalides.', errors })
      return
    }

    const discountType = payload.discountType === 'fixed' ? 'fixed' : invoice.discountType
    const discountValue =
      payload.discountValue !== undefined ? Number(payload.discountValue) : invoice.discountValue
    const items = (payload.items || invoice.items).map((item) => {
      const quantity = Number(item.quantity) || 0
      const unitPrice = Number(item.unitPrice) || 0
      return {
        id: item.id || crypto.randomUUID(),
        productId: item.productId || undefined,
        description: String(item.description || '').trim(),
        quantity,
        unitPrice,
        taxRate: Number(item.taxRate) || 0,
        total: Math.round(quantity * unitPrice * 100) / 100
      }
    })
    const totals = computeInvoiceTotals(items, discountType, discountValue)

    invoice.items = items
    invoice.discountType = discountType
    invoice.discountValue = discountValue
    invoice.discountAmount = totals.discountAmount
    invoice.subtotal = totals.subtotal
    invoice.taxTotal = totals.taxTotal
    invoice.total = totals.total
  }

  if (payload.issueDate) invoice.issueDate = payload.issueDate
  if (payload.dueDate) invoice.dueDate = payload.dueDate
  if (payload.notes !== undefined) invoice.notes = payload.notes || undefined
  if (payload.status) invoice.status = payload.status

  invoice.updatedAt = now()
  ok(res, withClientName(invoice))
})

// --- Paiements ----------------------------------------------------------

function validatePaymentPayload(payload) {
  const errors = {}
  if (!payload.invoiceId) errors.invoiceId = ['La facture est requise.']
  if (!(Number(payload.amount) > 0)) errors.amount = ['Le montant doit etre positif.']
  if (!['cash', 'card', 'bank_transfer', 'mobile_money', 'other'].includes(payload.method)) {
    errors.method = ['Moyen de paiement invalide.']
  }
  return errors
}

app.get('/api/v1/payments', requireAuth, (req, res) => {
  respondPaginated(
    res,
    req,
    payments.filter((p) => p.businessId === req.currentBusiness.id),
    'paidAt'
  )
})

app.get('/api/v1/invoices/:invoiceId/payments', requireAuth, (req, res) => {
  const invoice = invoices.find(
    (i) => i.id === req.params.invoiceId && i.businessId === req.currentBusiness.id
  )
  if (!invoice) {
    fail(res, 404, 'NOT_FOUND', 'Facture introuvable.')
    return
  }
  const invoicePayments = payments
    .filter((p) => p.invoiceId === invoice.id)
    .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime())
  ok(res, invoicePayments)
})

app.post('/api/v1/payments', requireAuth, (req, res) => {
  const payload = req.body || {}
  const errors = validatePaymentPayload(payload)
  if (Object.keys(errors).length > 0) {
    res
      .status(422)
      .json({ success: false, code: 'VALIDATION_ERROR', message: 'Donnees invalides.', errors })
    return
  }

  const invoice = invoices.find(
    (i) => i.id === payload.invoiceId && i.businessId === req.currentBusiness.id
  )
  if (!invoice) {
    res.status(422).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Donnees invalides.',
      errors: { invoiceId: ['Facture introuvable.'] }
    })
    return
  }

  const amount = Number(payload.amount)
  const remainingBalance = Math.round((invoice.total - invoice.amountPaid) * 100) / 100
  if (amount > remainingBalance) {
    res.status(422).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Donnees invalides.',
      errors: { amount: [`Le montant ne peut pas depasser le solde restant (${remainingBalance}).`] }
    })
    return
  }

  const payment = {
    id: crypto.randomUUID(),
    businessId: req.currentBusiness.id,
    invoiceId: invoice.id,
    amount,
    method: payload.method,
    status: 'completed',
    reference: payload.reference || undefined,
    paidAt: payload.paidAt || now(),
    notes: payload.notes || undefined,
    createdAt: now(),
    updatedAt: now()
  }
  payments.push(payment)

  invoice.amountPaid = Math.round((invoice.amountPaid + amount) * 100) / 100
  if (invoice.amountPaid >= invoice.total) {
    invoice.status = 'paid'
  } else if (invoice.amountPaid > 0) {
    invoice.status = 'partially_paid'
  }
  invoice.updatedAt = now()

  const currency = req.currentBusiness.currency || ''
  logActivity(
    req.currentBusiness.id,
    'payment_received',
    `Paiement de ${amount.toLocaleString('fr-FR')} ${currency} recu pour ${invoice.number}`,
    payment.createdAt
  )

  ok(res, payment)
})

// --- Tableau de bord ------------------------------------------------------

const PERIOD_DAYS = { today: 0, '7d': 7, '30d': 30, '3m': 90, year: 365 }

function getPeriodStart(period) {
  const start = new Date()
  if (period === 'today') {
    start.setHours(0, 0, 0, 0)
    return start
  }
  const days = PERIOD_DAYS[period] ?? PERIOD_DAYS['30d']
  start.setDate(start.getDate() - days)
  return start
}

function computeStats(businessId, period) {
  const start = getPeriodStart(period)
  const businessInvoices = invoices.filter((i) => i.businessId === businessId)
  const businessPayments = payments.filter((p) => p.businessId === businessId)

  const periodInvoices = businessInvoices.filter((i) => new Date(i.issueDate) >= start)
  const periodPayments = businessPayments.filter((p) => new Date(p.paidAt) >= start)

  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  const revenueThisMonth = businessPayments
    .filter((p) => new Date(p.paidAt) >= monthStart)
    .reduce((sum, p) => sum + p.amount, 0)

  const outstandingAmount = businessInvoices
    .filter((i) => ['sent', 'partially_paid', 'overdue'].includes(i.status))
    .reduce((sum, i) => sum + (i.total - i.amountPaid), 0)

  return {
    revenueTotal: periodPayments.reduce((sum, p) => sum + p.amount, 0),
    revenueThisMonth,
    outstandingAmount,
    invoicesCount: periodInvoices.length,
    paidInvoicesCount: periodInvoices.filter((i) => i.status === 'paid').length,
    unpaidInvoicesCount: periodInvoices.filter((i) =>
      ['sent', 'partially_paid', 'overdue'].includes(i.status)
    ).length,
    overdueInvoicesCount: periodInvoices.filter((i) => i.status === 'overdue').length,
    clientsCount: clients.filter((c) => c.businessId === businessId).length,
    productsCount: products.filter((p) => p.businessId === businessId).length
  }
}

function buildRevenueBuckets(period, businessPayments) {
  const buckets = []
  const nowDate = new Date()

  if (period === 'today') {
    for (let h = 23; h >= 0; h--) {
      const start = new Date(nowDate)
      start.setMinutes(0, 0, 0)
      start.setHours(start.getHours() - h)
      const end = new Date(start.getTime() + 60 * 60 * 1000)
      buckets.push({ start, end })
    }
  } else if (period === '7d' || period === '30d') {
    const days = period === '7d' ? 7 : 30
    for (let d = days - 1; d >= 0; d--) {
      const start = new Date(nowDate)
      start.setHours(0, 0, 0, 0)
      start.setDate(start.getDate() - d)
      const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
      buckets.push({ start, end })
    }
  } else if (period === '3m') {
    for (let w = 12; w >= 0; w--) {
      const end = new Date(nowDate)
      end.setHours(0, 0, 0, 0)
      end.setDate(end.getDate() - w * 7)
      const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000)
      buckets.push({ start, end })
    }
  } else {
    for (let m = 11; m >= 0; m--) {
      const start = new Date(nowDate.getFullYear(), nowDate.getMonth() - m, 1)
      const end = new Date(nowDate.getFullYear(), nowDate.getMonth() - m + 1, 1)
      buckets.push({ start, end })
    }
  }

  return buckets.map(({ start, end }) => ({
    date: start.toISOString(),
    amount: businessPayments
      .filter((p) => {
        const paidAt = new Date(p.paidAt)
        return paidAt >= start && paidAt < end
      })
      .reduce((sum, p) => sum + p.amount, 0)
  }))
}

function buildPaymentMethodBreakdown(period, businessPayments) {
  const start = getPeriodStart(period)
  const inPeriod = businessPayments.filter((p) => new Date(p.paidAt) >= start)
  const methods = ['cash', 'card', 'bank_transfer', 'mobile_money', 'other']

  return methods.map((method) => {
    const matched = inPeriod.filter((p) => p.method === method)
    return {
      method,
      amount: matched.reduce((sum, p) => sum + p.amount, 0),
      count: matched.length
    }
  })
}

app.get('/api/v1/dashboard/stats', requireAuth, (req, res) => {
  const period = typeof req.query.period === 'string' ? req.query.period : '30d'
  ok(res, computeStats(req.currentBusiness.id, period))
})

app.get('/api/v1/dashboard/revenue', requireAuth, (req, res) => {
  const period = typeof req.query.period === 'string' ? req.query.period : '30d'
  const businessPayments = payments.filter((p) => p.businessId === req.currentBusiness.id)
  ok(res, buildRevenueBuckets(period, businessPayments))
})

app.get('/api/v1/dashboard/payment-method-breakdown', requireAuth, (req, res) => {
  const period = typeof req.query.period === 'string' ? req.query.period : '30d'
  const businessPayments = payments.filter((p) => p.businessId === req.currentBusiness.id)
  ok(res, buildPaymentMethodBreakdown(period, businessPayments))
})

app.get('/api/v1/dashboard/invoice-status-breakdown', requireAuth, (req, res) => {
  const businessInvoices = invoices.filter((i) => i.businessId === req.currentBusiness.id)
  const statuses = ['draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled']
  ok(
    res,
    statuses.map((status) => ({
      status,
      count: businessInvoices.filter((i) => i.status === status).length
    }))
  )
})

app.get('/api/v1/dashboard/activity', requireAuth, (req, res) => {
  const limit = Math.max(1, Number(req.query.limit) || 8)
  const items = activities
    .filter((a) => a.businessId === req.currentBusiness.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)
    .map(({ businessId, ...rest }) => rest)
  ok(res, items)
})

// --- Rapports ---------------------------------------------------------

/**
 * Contexte commun a tous les rapports : applique client/statut/produit sur
 * les factures (independant de la periode, car un client/produit/statut
 * filtre le "quoi", pas le "quand"), puis derive deux ensembles bornes dans
 * le temps - les factures emises sur la periode (`periodInvoices`, utilise
 * pour factures/produits/clients) et les paiements encaisses sur la periode
 * (`periodPayments`, utilise pour le chiffre d'affaires), coherent avec la
 * definition deja retenue pour le tableau de bord.
 */
function getReportContext(businessId, query) {
  const period = typeof query.period === 'string' ? query.period : '30d'
  const clientId = typeof query.clientId === 'string' ? query.clientId : undefined
  const status = typeof query.status === 'string' ? query.status : undefined
  const productId = typeof query.productId === 'string' ? query.productId : undefined

  let qualifyingInvoices = invoices.filter((i) => i.businessId === businessId)
  if (clientId) qualifyingInvoices = qualifyingInvoices.filter((i) => i.clientId === clientId)
  if (status) qualifyingInvoices = qualifyingInvoices.filter((i) => i.status === status)
  if (productId) {
    qualifyingInvoices = qualifyingInvoices.filter((i) =>
      i.items.some((item) => item.productId === productId)
    )
  }
  const qualifyingIds = new Set(qualifyingInvoices.map((i) => i.id))

  const periodStart = getPeriodStart(period)
  const periodInvoices = qualifyingInvoices.filter((i) => new Date(i.issueDate) >= periodStart)

  const qualifyingPayments = payments.filter(
    (p) => p.businessId === businessId && qualifyingIds.has(p.invoiceId)
  )
  const periodPayments = qualifyingPayments.filter((p) => new Date(p.paidAt) >= periodStart)

  return { period, qualifyingInvoices, qualifyingPayments, periodInvoices, periodPayments }
}

const SALES_STATUSES = ['sent', 'paid', 'partially_paid', 'overdue']

app.get('/api/v1/reports/summary', requireAuth, (req, res) => {
  const { periodInvoices, periodPayments } = getReportContext(req.currentBusiness.id, req.query)

  const unpaidInvoices = periodInvoices.filter((i) =>
    ['sent', 'partially_paid', 'overdue'].includes(i.status)
  )

  ok(res, {
    revenueTotal: periodPayments.reduce((sum, p) => sum + p.amount, 0),
    salesCount: periodInvoices.filter((i) => SALES_STATUSES.includes(i.status)).length,
    invoicesCount: periodInvoices.length,
    unpaidTotal: unpaidInvoices.reduce((sum, i) => sum + (i.total - i.amountPaid), 0),
    unpaidCount: unpaidInvoices.length
  })
})

app.get('/api/v1/reports/revenue', requireAuth, (req, res) => {
  const { period, qualifyingPayments } = getReportContext(req.currentBusiness.id, req.query)
  ok(res, buildRevenueBuckets(period, qualifyingPayments))
})

app.get('/api/v1/reports/invoice-status', requireAuth, (req, res) => {
  const { periodInvoices } = getReportContext(req.currentBusiness.id, req.query)
  const statuses = ['draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled']
  ok(
    res,
    statuses.map((status) => {
      const matched = periodInvoices.filter((i) => i.status === status)
      return {
        status,
        count: matched.length,
        amount: matched.reduce((sum, i) => sum + i.total, 0)
      }
    })
  )
})

app.get('/api/v1/reports/payment-methods', requireAuth, (req, res) => {
  const { period, qualifyingPayments } = getReportContext(req.currentBusiness.id, req.query)
  ok(res, buildPaymentMethodBreakdown(period, qualifyingPayments))
})

app.get('/api/v1/reports/top-products', requireAuth, (req, res) => {
  const { periodInvoices } = getReportContext(req.currentBusiness.id, req.query)
  const productId = typeof req.query.productId === 'string' ? req.query.productId : undefined

  const totals = new Map()
  periodInvoices
    .filter((i) => SALES_STATUSES.includes(i.status))
    .forEach((invoice) => {
      invoice.items.forEach((item) => {
        if (!item.productId) return
        if (productId && item.productId !== productId) return
        const product = products.find((p) => p.id === item.productId)
        const current = totals.get(item.productId) || {
          productId: item.productId,
          name: product ? product.name : item.description,
          quantitySold: 0,
          revenue: 0
        }
        current.quantitySold += item.quantity
        current.revenue += item.total
        totals.set(item.productId, current)
      })
    })

  const ranked = Array.from(totals.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
  ok(res, ranked)
})

app.get('/api/v1/reports/top-clients', requireAuth, (req, res) => {
  const { periodInvoices } = getReportContext(req.currentBusiness.id, req.query)

  const totals = new Map()
  periodInvoices
    .filter((i) => SALES_STATUSES.includes(i.status))
    .forEach((invoice) => {
      const client = clients.find((c) => c.id === invoice.clientId)
      const current = totals.get(invoice.clientId) || {
        clientId: invoice.clientId,
        name: client ? `${client.firstName} ${client.lastName}` : 'Client supprime',
        invoicesCount: 0,
        totalSpent: 0
      }
      current.invoicesCount += 1
      current.totalSpent += invoice.total
      totals.set(invoice.clientId, current)
    })

  const ranked = Array.from(totals.values())
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10)
  ok(res, ranked)
})

// --- Utilisateurs / equipe ------------------------------------------------

/**
 * Verifie une permission precise sur `req.currentUser`. Contrairement aux
 * autres ressources de ce serveur factice (qui se contentent de
 * `requireAuth`), la gestion d'equipe applique ici une verification de
 * permission explicite : c'est la securite reelle, le frontend
 * (`usePermissions`) ne sert lui qu'a l'UX.
 */
function requirePermission(permission) {
  return function (req, res, next) {
    const permissions = req.currentUser.permissions || []
    if (!permissions.includes(permission)) {
      fail(res, 403, 'FORBIDDEN', "Vous n'avez pas la permission d'effectuer cette action.")
      return
    }
    next()
  }
}

function matchesUserSearch(user, search) {
  if (!search) return true
  const needle = search.toLowerCase()
  return [user.firstName, user.lastName, user.email]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(needle))
}

function findTeamMember(req) {
  return users.find((u) => u.id === req.params.id && u.businessId === req.currentBusiness.id)
}

function validateInvitePayload(payload) {
  const errors = {}
  if (!String(payload.firstName || '').trim()) {
    errors.firstName = ['Le prenom est requis.']
  }
  if (!String(payload.lastName || '').trim()) {
    errors.lastName = ['Le nom est requis.']
  }
  if (!String(payload.email || '').trim()) {
    errors.email = ["L'email est requis."]
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    errors.email = ["Le format de l'email est invalide."]
  }
  if (payload.role && !INVITABLE_ROLES.includes(payload.role)) {
    errors.role = ['Role invalide.']
  }
  return errors
}

app.get('/api/v1/users', requireAuth, requirePermission('user:manage'), (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search : ''
  const businessUsers = users
    .filter((u) => u.businessId === req.currentBusiness.id && matchesUserSearch(u, search))
    .map(publicUser)
  respondPaginated(res, req, businessUsers, 'firstName')
})

app.get('/api/v1/users/:id', requireAuth, requirePermission('user:manage'), (req, res) => {
  const user = findTeamMember(req)
  if (!user) {
    fail(res, 404, 'NOT_FOUND', 'Utilisateur introuvable.')
    return
  }
  ok(res, publicUser(user))
})

app.post('/api/v1/users', requireAuth, requirePermission('user:manage'), (req, res) => {
  const payload = req.body || {}
  const errors = validateInvitePayload(payload)
  if (Object.keys(errors).length > 0) {
    res
      .status(422)
      .json({ success: false, code: 'VALIDATION_ERROR', message: 'Donnees invalides.', errors })
    return
  }
  if (users.some((u) => u.email.toLowerCase() === String(payload.email).toLowerCase())) {
    fail(res, 409, 'EMAIL_TAKEN', 'Un utilisateur existe deja avec cet email.')
    return
  }

  const role = payload.role || 'cashier'
  const user = {
    id: crypto.randomUUID(),
    businessId: req.currentBusiness.id,
    firstName: payload.firstName.trim(),
    lastName: payload.lastName.trim(),
    email: payload.email.trim(),
    password: crypto.randomUUID(), // pas de flux d'invitation par email dans ce serveur factice
    phone: payload.phone || undefined,
    role,
    permissions: ROLE_PERMISSIONS[role] || [],
    avatarUrl: undefined,
    isActive: true,
    lastLoginAt: undefined,
    createdAt: now(),
    updatedAt: now()
  }
  users.push(user)
  logActivity(
    req.currentBusiness.id,
    'user_invited',
    `Nouvel utilisateur invite : ${user.firstName} ${user.lastName}`,
    user.createdAt
  )
  ok(res, publicUser(user))
})

app.patch('/api/v1/users/:id', requireAuth, requirePermission('user:manage'), (req, res) => {
  const user = findTeamMember(req)
  if (!user) {
    fail(res, 404, 'NOT_FOUND', 'Utilisateur introuvable.')
    return
  }
  if (user.role === 'owner') {
    fail(res, 422, 'OWNER_PROTECTED', 'Le proprietaire du compte ne peut pas etre modifie.')
    return
  }
  if (user.id === req.currentUser.id) {
    fail(res, 422, 'SELF_ACTION_FORBIDDEN', 'Vous ne pouvez pas modifier votre propre compte ici.')
    return
  }

  const payload = req.body || {}
  const errors = {}
  if (Object.prototype.hasOwnProperty.call(payload, 'role') && !INVITABLE_ROLES.includes(payload.role)) {
    errors.role = ['Role invalide.']
  }
  if (Object.keys(errors).length > 0) {
    res
      .status(422)
      .json({ success: false, code: 'VALIDATION_ERROR', message: 'Donnees invalides.', errors })
    return
  }

  if (payload.role) {
    user.role = payload.role
    user.permissions = ROLE_PERMISSIONS[payload.role] || []
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'isActive')) {
    user.isActive = Boolean(payload.isActive)
  }
  if (payload.firstName) user.firstName = payload.firstName.trim()
  if (payload.lastName) user.lastName = payload.lastName.trim()
  if (Object.prototype.hasOwnProperty.call(payload, 'phone')) user.phone = payload.phone || undefined
  user.updatedAt = now()

  ok(res, publicUser(user))
})

app.delete('/api/v1/users/:id', requireAuth, requirePermission('user:manage'), (req, res) => {
  const user = findTeamMember(req)
  if (!user) {
    fail(res, 404, 'NOT_FOUND', 'Utilisateur introuvable.')
    return
  }
  if (user.role === 'owner') {
    fail(res, 422, 'OWNER_PROTECTED', 'Le proprietaire du compte ne peut pas etre supprime.')
    return
  }
  if (user.id === req.currentUser.id) {
    fail(res, 422, 'SELF_ACTION_FORBIDDEN', 'Vous ne pouvez pas supprimer votre propre compte.')
    return
  }

  const index = users.findIndex((u) => u.id === user.id)
  users.splice(index, 1)
  for (const token of [...accessTokens.entries()]) {
    if (token[1] === user.id) accessTokens.delete(token[0])
  }
  for (const token of [...refreshTokens.entries()]) {
    if (token[1] === user.id) refreshTokens.delete(token[0])
  }
  ok(res, null)
})

// --- Parametres du commerce ------------------------------------------------

const BUSINESS_TYPES = ['restaurant', 'boutique', 'salon_coiffure', 'hotel', 'pharmacie', 'pme', 'autre']

function validateBusinessPayload(payload) {
  const errors = {}
  const has = (key) => Object.prototype.hasOwnProperty.call(payload, key)

  if (has('name') && !String(payload.name || '').trim()) {
    errors.name = ['Le nom du commerce est requis.']
  }
  if (has('businessType') && !BUSINESS_TYPES.includes(payload.businessType)) {
    errors.businessType = ['Categorie de commerce invalide.']
  }
  if (has('email')) {
    if (!String(payload.email || '').trim()) {
      errors.email = ["L'email est requis."]
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      errors.email = ["Le format de l'email est invalide."]
    }
  }
  if (has('currency') && !String(payload.currency || '').trim()) {
    errors.currency = ['La devise est requise.']
  }
  if (has('defaultVatRate')) {
    const rate = Number(payload.defaultVatRate)
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      errors.defaultVatRate = ['Le taux de TVA doit etre compris entre 0 et 100.']
    }
  }

  if (has('invoiceSettings')) {
    const settings = payload.invoiceSettings || {}
    if (!String(settings.numberPrefix || '').trim()) {
      errors.numberPrefix = ['Le prefixe de numerotation est requis.']
    }
    if (!Number.isInteger(settings.numberPadding) || settings.numberPadding < 1 || settings.numberPadding > 10) {
      errors.numberPadding = ['Doit etre un nombre entier entre 1 et 10.']
    }
    if (!Number.isInteger(settings.nextNumber) || settings.nextNumber < 1) {
      errors.nextNumber = ['Doit etre un nombre entier superieur ou egal a 1.']
    }
    if (!Number.isInteger(settings.defaultPaymentTermDays) || settings.defaultPaymentTermDays < 0) {
      errors.defaultPaymentTermDays = ['Doit etre un nombre entier positif ou nul.']
    }
  }

  return errors
}

app.patch('/api/v1/business', requireAuth, requirePermission('settings:manage'), (req, res) => {
  const payload = req.body || {}
  const errors = validateBusinessPayload(payload)
  if (Object.keys(errors).length > 0) {
    res
      .status(422)
      .json({ success: false, code: 'VALIDATION_ERROR', message: 'Donnees invalides.', errors })
    return
  }

  const business = req.currentBusiness
  const { invoiceSettings, ...rest } = payload
  Object.assign(business, rest)
  if (invoiceSettings) {
    Object.assign(business.invoiceSettings, invoiceSettings)
  }
  business.updatedAt = now()

  ok(res, business)
})

app.post('/api/v1/business/logo', requireAuth, requirePermission('settings:manage'), (req, res) => {
  uploadLogo.single('logo')(req, res, (err) => {
    if (err) {
      if (err.message === 'INVALID_FILE_TYPE') {
        fail(
          res,
          422,
          'INVALID_FILE_TYPE',
          'Format de fichier non supporte (PNG, JPEG, WEBP ou SVG uniquement).'
        )
        return
      }
      if (err.code === 'LIMIT_FILE_SIZE') {
        fail(res, 422, 'FILE_TOO_LARGE', 'Le logo ne doit pas depasser 2 Mo.')
        return
      }
      fail(res, 422, 'UPLOAD_ERROR', 'Le televersement du logo a echoue.')
      return
    }
    if (!req.file) {
      fail(res, 422, 'VALIDATION_ERROR', 'Aucun fichier recu.')
      return
    }

    const business = req.currentBusiness

    // Supprime l'ancien logo du disque s'il existait, pour ne pas accumuler
    // de fichiers orphelins au fil des remplacements.
    if (business.logoUrl) {
      const oldFilename = business.logoUrl.split('/uploads/')[1]
      if (oldFilename) {
        fs.unlink(path.join(UPLOADS_DIR, oldFilename), () => {})
      }
    }

    business.logoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
    business.updatedAt = now()
    ok(res, business)
  })
})

// --- Abonnement SaaS --------------------------------------------------

app.get('/api/v1/subscription', requireAuth, requirePermission('subscription:read'), (req, res) => {
  const record = subscriptions.find((s) => s.businessId === req.currentBusiness.id)
  if (!record) {
    fail(res, 404, 'NOT_FOUND', 'Abonnement introuvable.')
    return
  }
  ok(res, serializeSubscription(record))
})

app.get(
  '/api/v1/subscription/plans',
  requireAuth,
  requirePermission('subscription:read'),
  (_req, res) => {
    ok(res, SUBSCRIPTION_PLANS)
  }
)

app.post(
  '/api/v1/subscription/change-plan',
  requireAuth,
  requirePermission('subscription:manage'),
  (req, res) => {
    const { planId } = req.body || {}
    const plan = resolvePlan(planId)
    if (!plan) {
      res.status(422).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Donnees invalides.',
        errors: { planId: ['Plan introuvable.'] }
      })
      return
    }

    const record = subscriptions.find((s) => s.businessId === req.currentBusiness.id)
    if (!record) {
      fail(res, 404, 'NOT_FOUND', 'Abonnement introuvable.')
      return
    }

    record.planId = plan.id
    // Choisir un nouveau plan reactive un abonnement annule/expire, sur une
    // periode toute neuve.
    if (record.status === 'canceled' || record.status === 'expired') {
      const bounds = getCurrentPeriodBounds()
      record.currentPeriodStart = bounds.start
      record.currentPeriodEnd = bounds.end
      record.status = 'active'
    }
    record.cancelAtPeriodEnd = false
    record.updatedAt = now()

    logActivity(
      req.currentBusiness.id,
      'subscription_changed',
      `Abonnement passe au plan ${plan.name}`,
      record.updatedAt
    )
    ok(res, serializeSubscription(record))
  }
)

app.post(
  '/api/v1/subscription/cancel',
  requireAuth,
  requirePermission('subscription:manage'),
  (req, res) => {
    const record = subscriptions.find((s) => s.businessId === req.currentBusiness.id)
    if (!record) {
      fail(res, 404, 'NOT_FOUND', 'Abonnement introuvable.')
      return
    }
    if (record.status === 'canceled') {
      fail(res, 422, 'ALREADY_CANCELED', 'Cet abonnement est deja annule.')
      return
    }

    record.status = 'canceled'
    record.cancelAtPeriodEnd = true
    record.updatedAt = now()

    logActivity(req.currentBusiness.id, 'subscription_canceled', 'Abonnement annule', record.updatedAt)
    ok(res, serializeSubscription(record))
  }
)

// --- Espace admin plateforme -------------------------------------------

function issueAdminTokens(adminId) {
  const accessToken = crypto.randomUUID()
  const refreshToken = crypto.randomUUID()
  adminAccessTokens.set(accessToken, adminId)
  adminRefreshTokens.set(refreshToken, adminId)
  return { accessToken, refreshToken }
}

function publicAdmin(admin) {
  const { password, ...rest } = admin
  return rest
}

function findBusinessOwner(businessId) {
  return users.find((u) => u.businessId === businessId && u.role === 'owner')
}

/** Journal d'audit des actions admin : jamais modifiable/supprimable via l'API. */
function logAdminAction(admin, business, action, message) {
  adminAuditLog.push({
    id: crypto.randomUUID(),
    adminId: admin.id,
    adminName: `${admin.firstName} ${admin.lastName}`,
    businessId: business.id,
    businessName: business.name,
    action,
    message,
    createdAt: now()
  })
}

function serializeAdminBusinessSummary(business) {
  const owner = findBusinessOwner(business.id)
  const subscriptionRecord = subscriptions.find((s) => s.businessId === business.id)
  const plan = subscriptionRecord ? resolvePlan(subscriptionRecord.planId) : undefined

  return {
    id: business.id,
    name: business.name,
    businessType: business.businessType,
    ownerName: owner ? `${owner.firstName} ${owner.lastName}` : 'Inconnu',
    ownerEmail: owner ? owner.email : '',
    isSuspended: business.isSuspended,
    subscriptionStatus: subscriptionRecord ? subscriptionRecord.status : 'expired',
    planName: plan ? plan.name : 'Aucun',
    createdAt: business.createdAt
  }
}

function serializeAdminBusinessDetail(business) {
  const summary = serializeAdminBusinessSummary(business)
  const subscriptionRecord = subscriptions.find((s) => s.businessId === business.id)

  return {
    ...summary,
    email: business.email,
    phone: business.phone,
    currency: business.currency,
    usersCount: users.filter((u) => u.businessId === business.id).length,
    clientsCount: clients.filter((c) => c.businessId === business.id).length,
    invoicesCount: invoices.filter((i) => i.businessId === business.id).length,
    subscription: subscriptionRecord ? serializeSubscription(subscriptionRecord) : undefined
  }
}

const SUBSCRIPTION_STATUSES_FOR_STATS = ['trial', 'active', 'past_due', 'canceled', 'expired']

function computePlatformStats() {
  const businessesByStatus = Object.fromEntries(SUBSCRIPTION_STATUSES_FOR_STATS.map((s) => [s, 0]))
  let monthlyRecurringRevenue = 0

  for (const business of businesses) {
    const subscriptionRecord = subscriptions.find((s) => s.businessId === business.id)
    const status = subscriptionRecord ? subscriptionRecord.status : 'expired'
    businessesByStatus[status] = (businessesByStatus[status] || 0) + 1

    if (subscriptionRecord && (status === 'active' || status === 'past_due')) {
      const plan = resolvePlan(subscriptionRecord.planId)
      if (plan) monthlyRecurringRevenue += plan.price
    }
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const newBusinessesLast30Days = businesses.filter((b) => b.createdAt >= thirtyDaysAgo).length

  return {
    totalBusinesses: businesses.length,
    businessesByStatus,
    monthlyRecurringRevenue,
    newBusinessesLast30Days
  }
}

app.post('/api/v1/admin/auth/login', (req, res) => {
  const { email, password } = req.body || {}
  const admin = platformAdmins.find(
    (a) => a.email.toLowerCase() === String(email || '').toLowerCase()
  )

  if (!admin || admin.password !== password) {
    fail(res, 401, 'INVALID_CREDENTIALS', 'Email ou mot de passe incorrect.')
    return
  }
  if (!admin.isActive) {
    fail(res, 403, 'ACCOUNT_DISABLED', 'Ce compte administrateur est desactive.')
    return
  }

  const tokens = issueAdminTokens(admin.id)
  ok(res, { admin: publicAdmin(admin), tokens })
})

app.post('/api/v1/admin/auth/logout', requireAdminAuth, (req, res) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (token) adminAccessTokens.delete(token)
  ok(res, null)
})

app.get('/api/v1/admin/auth/me', requireAdminAuth, (req, res) => {
  ok(res, publicAdmin(req.currentAdmin))
})

app.post('/api/v1/admin/auth/refresh', (req, res) => {
  const { refreshToken } = req.body || {}
  const adminId = refreshToken ? adminRefreshTokens.get(refreshToken) : null

  if (!adminId) {
    fail(res, 401, 'INVALID_REFRESH_TOKEN', 'Jeton de rafraichissement invalide.')
    return
  }

  adminRefreshTokens.delete(refreshToken)
  const tokens = issueAdminTokens(adminId)
  ok(res, tokens)
})

app.get('/api/v1/admin/stats', requireAdminAuth, (_req, res) => {
  ok(res, computePlatformStats())
})

app.get('/api/v1/admin/businesses', requireAdminAuth, (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search.toLowerCase() : ''
  const statusFilter = typeof req.query.subscriptionStatus === 'string' ? req.query.subscriptionStatus : ''

  const summaries = businesses
    .map(serializeAdminBusinessSummary)
    .filter((summary) => {
      const matchesSearch =
        !search ||
        summary.name.toLowerCase().includes(search) ||
        summary.ownerEmail.toLowerCase().includes(search) ||
        summary.ownerName.toLowerCase().includes(search)
      const matchesStatus = !statusFilter || summary.subscriptionStatus === statusFilter
      return matchesSearch && matchesStatus
    })

  respondPaginated(res, req, summaries, 'createdAt')
})

function findBusinessOr404(req, res) {
  const business = businesses.find((b) => b.id === req.params.id)
  if (!business) {
    fail(res, 404, 'NOT_FOUND', 'Commerce introuvable.')
    return null
  }
  return business
}

app.get('/api/v1/admin/businesses/:id', requireAdminAuth, (req, res) => {
  const business = findBusinessOr404(req, res)
  if (!business) return
  ok(res, serializeAdminBusinessDetail(business))
})

app.patch('/api/v1/admin/businesses/:id/suspend', requireAdminAuth, (req, res) => {
  const business = findBusinessOr404(req, res)
  if (!business) return

  const { isSuspended } = req.body || {}
  business.isSuspended = Boolean(isSuspended)
  business.updatedAt = now()

  logAdminAction(
    req.currentAdmin,
    business,
    business.isSuspended ? 'business_suspended' : 'business_reactivated',
    business.isSuspended
      ? `Commerce suspendu par ${req.currentAdmin.firstName} ${req.currentAdmin.lastName}`
      : `Commerce reactive par ${req.currentAdmin.firstName} ${req.currentAdmin.lastName}`
  )

  ok(res, serializeAdminBusinessDetail(business))
})

app.post('/api/v1/admin/businesses/:id/plan', requireAdminAuth, (req, res) => {
  const business = findBusinessOr404(req, res)
  if (!business) return

  const { planId } = req.body || {}
  const plan = resolvePlan(planId)
  if (!plan) {
    res.status(422).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Donnees invalides.',
      errors: { planId: ['Plan introuvable.'] }
    })
    return
  }

  const record = subscriptions.find((s) => s.businessId === business.id)
  if (!record) {
    fail(res, 404, 'NOT_FOUND', 'Abonnement introuvable pour ce commerce.')
    return
  }

  const previousPlanName = resolvePlan(record.planId)?.name
  record.planId = plan.id
  if (record.status === 'canceled' || record.status === 'expired') {
    record.status = 'active'
  }
  record.updatedAt = now()

  logAdminAction(
    req.currentAdmin,
    business,
    'plan_changed',
    `Plan change de "${previousPlanName}" a "${plan.name}" par ${req.currentAdmin.firstName} ${req.currentAdmin.lastName}`
  )

  ok(res, serializeAdminBusinessDetail(business))
})

app.get('/api/v1/admin/businesses/:id/audit-log', requireAdminAuth, (req, res) => {
  const business = findBusinessOr404(req, res)
  if (!business) return

  const entries = adminAuditLog.filter((entry) => entry.businessId === business.id)
  respondPaginated(res, req, entries, 'createdAt')
})

app.get('/api/v1/admin/plans', requireAdminAuth, (_req, res) => {
  ok(res, SUBSCRIPTION_PLANS)
})

function validatePlanPayload(payload, { partial }) {
  const errors = {}
  const has = (key) => Object.prototype.hasOwnProperty.call(payload, key)

  if ((!partial || has('name')) && !String(payload.name || '').trim()) {
    errors.name = ['Le nom du plan est requis.']
  }
  if (has('price')) {
    const price = Number(payload.price)
    if (!Number.isFinite(price) || price < 0) {
      errors.price = ['Le prix doit etre un nombre positif ou nul.']
    }
  }
  return errors
}

app.post('/api/v1/admin/plans', requireAdminAuth, (req, res) => {
  const payload = req.body || {}
  const errors = validatePlanPayload(payload, { partial: false })
  if (Object.keys(errors).length > 0) {
    res
      .status(422)
      .json({ success: false, code: 'VALIDATION_ERROR', message: 'Donnees invalides.', errors })
    return
  }

  const plan = {
    id: `plan-${crypto.randomUUID().slice(0, 8)}`,
    name: payload.name.trim(),
    description: payload.description || undefined,
    price: Number(payload.price),
    billingCycle: payload.billingCycle === 'yearly' ? 'yearly' : 'monthly',
    features: Array.isArray(payload.features) ? payload.features : [],
    limits: {
      maxInvoicesPerMonth: payload.limits?.maxInvoicesPerMonth ?? null,
      maxClients: payload.limits?.maxClients ?? null,
      maxUsers: payload.limits?.maxUsers ?? null
    }
  }
  SUBSCRIPTION_PLANS.push(plan)
  ok(res, plan)
})

app.patch('/api/v1/admin/plans/:id', requireAdminAuth, (req, res) => {
  const plan = resolvePlan(req.params.id)
  if (!plan) {
    fail(res, 404, 'NOT_FOUND', 'Plan introuvable.')
    return
  }

  const payload = req.body || {}
  const errors = validatePlanPayload(payload, { partial: true })
  if (Object.keys(errors).length > 0) {
    res
      .status(422)
      .json({ success: false, code: 'VALIDATION_ERROR', message: 'Donnees invalides.', errors })
    return
  }

  if (payload.name) plan.name = payload.name.trim()
  if (Object.prototype.hasOwnProperty.call(payload, 'description')) plan.description = payload.description || undefined
  if (Object.prototype.hasOwnProperty.call(payload, 'price')) plan.price = Number(payload.price)
  if (Array.isArray(payload.features)) plan.features = payload.features
  if (payload.limits) {
    plan.limits = {
      maxInvoicesPerMonth:
        payload.limits.maxInvoicesPerMonth === undefined
          ? plan.limits.maxInvoicesPerMonth
          : payload.limits.maxInvoicesPerMonth,
      maxClients:
        payload.limits.maxClients === undefined ? plan.limits.maxClients : payload.limits.maxClients,
      maxUsers: payload.limits.maxUsers === undefined ? plan.limits.maxUsers : payload.limits.maxUsers
    }
  }

  ok(res, plan)
})

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

app.listen(PORT, () => {
  console.log(`Mock backend Facture IA sur http://localhost:${PORT}`)
  console.log("Compte de demo (avec donnees d'exemple): demo@facture-ia.com / password123")
})
