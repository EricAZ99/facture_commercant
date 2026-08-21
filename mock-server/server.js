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

// Pieces jointes libres (factures) : n'importe quel type de fichier, taille
// plus genereuse que le logo, meme mecanisme de stockage sur disque.
const ATTACHMENT_MAX_SIZE_BYTES = 10 * 1024 * 1024

const uploadAttachment = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${path.extname(file.originalname)}`)
  }),
  limits: { fileSize: ATTACHMENT_MAX_SIZE_BYTES }
})

// --- "Base de donnees" en memoire ------------------------------------------

const businesses = []
const users = []
const clients = []
const products = []
const productCategories = []
const productKits = []
const productStockMovements = []
const invoiceAttachments = []
const invoices = []
const quotes = []
const creditNotes = []
const payments = []
const refunds = []
const installmentPlans = []
const subscriptions = []
const activities = []
/** token -> userId */
const accessTokens = new Map()
/** token -> userId */
const refreshTokens = new Map()
/** Historique de connexion des utilisateurs commercants (qui, quand). */
const userLoginHistory = []

// --- Espace admin plateforme : identite et donnees entierement separees
// des commercants (`users`) ci-dessus. Aucun admin n'a de `businessId`.
const platformAdmins = []
const adminAuditLog = []
/** Historique de connexion des administrateurs (qui, quand). */
const adminLoginHistory = []
/** Tickets support commercant <-> admin. */
const supportTickets = []
/** Evenements plateforme notifies aux admins (nouveau commerce, nouveau ticket...). */
const platformEvents = []
/** token -> adminId */
const adminAccessTokens = new Map()
/** token -> adminId */
const adminRefreshTokens = new Map()
/**
 * Tickets d'apercu ("mode apercu" admin) : ticket -> { userId, expiresAt }.
 * A usage unique et courte duree de vie (voir `/admin/businesses/:id/impersonate`
 * et `/auth/impersonate-exchange`).
 */
const impersonationTickets = new Map()

/** Parametres globaux de la plateforme, geres depuis l'espace admin. */
const platformSettings = {
  supportedCurrencies: ['XOF', 'XAF', 'EUR', 'USD', 'GBP', 'MAD', 'GNF', 'NGN'],
  legalMentions: '',
  defaultTermsAndConditions: ''
}

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
/** Codes promo statiques de demonstration (% de remise cosmetique, aucune facturation reelle). */
const PROMO_CODES = { BIENVENUE10: 10, LAUNCH20: 20 }
/** Remise appliquee quand le code saisi est le code de parrainage d'un autre commerce. */
const REFERRAL_DISCOUNT_PERCENT = 15

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
    id: 'plan-standard-yearly',
    name: 'Standard',
    // 20% de reduction par rapport a 12 mensualites (15000 x 12 x 0.8).
    description: 'Pour les commerces en croissance. 2 mois offerts.',
    price: 144000,
    billingCycle: 'yearly',
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
  },
  {
    id: 'plan-premium-yearly',
    name: 'Premium',
    // 20% de reduction par rapport a 12 mensualites (35000 x 12 x 0.8).
    description: 'Sans limites, pour les commerces etablis. 2 mois offerts.',
    price: 336000,
    billingCycle: 'yearly',
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
    promoCode: record.promoCode,
    discountPercent: record.discountPercent,
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

/** Configuration de numerotation des devis par defaut d'un commerce nouvellement cree. */
function defaultQuoteSettings() {
  return {
    numberPrefix: 'DE-',
    nextNumber: 1,
    numberPadding: 4
  }
}

/** Configuration de numerotation des avoirs par defaut d'un commerce nouvellement cree. */
function defaultCreditNoteSettings() {
  return {
    numberPrefix: 'AV-',
    nextNumber: 1,
    numberPadding: 4
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

/** Code de parrainage court et lisible, unique par commerce. */
function generateReferralCode() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()
}

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
    quoteSettings: defaultQuoteSettings(),
    creditNoteSettings: defaultCreditNoteSettings(),
    isSuspended: false,
    // Objectif de demo pour illustrer le widget "Objectif du mois" des la
    // premiere connexion.
    monthlyRevenueTarget: 500000,
    referralCode: generateReferralCode(),
    referralRedemptions: 0,
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

  // Quelques categories de demonstration, dont une hierarchie a deux
  // niveaux (Vetements > Hauts) pour illustrer l'arborescence.
  const categoryVetements = {
    id: crypto.randomUUID(),
    businessId,
    name: 'Vetements',
    parentId: undefined,
    createdAt: daysAgo(350).toISOString(),
    updatedAt: now()
  }
  const categoryHauts = {
    id: crypto.randomUUID(),
    businessId,
    name: 'Hauts',
    parentId: categoryVetements.id,
    createdAt: daysAgo(350).toISOString(),
    updatedAt: now()
  }
  const categoryAccessoires = {
    id: crypto.randomUUID(),
    businessId,
    name: 'Accessoires',
    parentId: undefined,
    createdAt: daysAgo(350).toISOString(),
    updatedAt: now()
  }
  const categoryServices = {
    id: crypto.randomUUID(),
    businessId,
    name: 'Services',
    parentId: undefined,
    createdAt: daysAgo(350).toISOString(),
    updatedAt: now()
  }
  productCategories.push(categoryVetements, categoryHauts, categoryAccessoires, categoryServices)

  const productSpecs = [
    { name: 'T-shirt coton', categoryId: categoryHauts.id, type: 'product', price: 8000, stock: 42 },
    { name: 'Robe wax', categoryId: categoryVetements.id, type: 'product', price: 25000, stock: 15 },
    { name: 'Sac a main', categoryId: categoryAccessoires.id, type: 'product', price: 18000, stock: 8 },
    {
      name: 'Chaussures cuir',
      categoryId: categoryAccessoires.id,
      type: 'product',
      price: 32000,
      stock: 5
    },
    { name: 'Retouche vetement', categoryId: categoryServices.id, type: 'service', price: 6000 }
  ]
  const seededProducts = productSpecs.map((spec, index) => {
    const product = {
      id: crypto.randomUUID(),
      businessId,
      name: spec.name,
      description: undefined,
      categoryId: spec.categoryId,
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

  // Un kit de demonstration combinant deux produits deja crees ci-dessus.
  const kitTshirt = seededProducts[0]
  const kitSac = seededProducts[2]
  if (kitTshirt && kitSac) {
    productKits.push({
      id: crypto.randomUUID(),
      businessId,
      name: 'Pack Tenue + Sac',
      description: 'T-shirt coton et sac a main, vendus ensemble a prix reduit.',
      sku: 'KIT-1',
      items: [
        { productId: kitTshirt.id, quantity: 1 },
        { productId: kitSac.id, quantity: 1 }
      ],
      customPrice: 24000,
      isActive: true,
      createdAt: daysAgo(200).toISOString(),
      updatedAt: now()
    })
  }

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

// Compte administrateur plateforme de demo (super-admin : seul role pouvant
// gerer les autres comptes admin).
platformAdmins.push({
  id: crypto.randomUUID(),
  firstName: 'Admin',
  lastName: 'Plateforme',
  email: 'admin@facture-ia.com',
  password: 'admin123',
  role: 'super_admin',
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

/**
 * Seuls les super-admins peuvent gerer d'autres comptes admin (inviter,
 * changer de role, desactiver) ou les parametres globaux de la plateforme.
 * Le role `support` reste en lecture seule sur ces perimetres.
 */
function requireSuperAdmin(req, res, next) {
  if (req.currentAdmin.role !== 'super_admin') {
    fail(res, 403, 'FORBIDDEN', 'Reserve aux super-administrateurs.')
    return
  }
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
    quoteSettings: defaultQuoteSettings(),
    creditNoteSettings: defaultCreditNoteSettings(),
    isSuspended: false,
    monthlyRevenueTarget: null,
    referralCode: generateReferralCode(),
    referralRedemptions: 0,
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
  logPlatformEvent('business_registered', `Nouveau commerce inscrit : ${business.name}`)

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
  userLoginHistory.push({
    id: crypto.randomUUID(),
    userId: user.id,
    userAgent: req.headers['user-agent'] || 'inconnu',
    ipAddress: req.ip || req.socket?.remoteAddress || 'inconnue',
    createdAt: now()
  })
  const tokens = issueTokens(user.id)
  ok(res, { user: publicUser(user), business, tokens })
})

/**
 * Echange un ticket d'apercu (emis par `/admin/businesses/:id/impersonate`)
 * contre une vraie session commercant. Le ticket est a usage unique et
 * expire apres 60 secondes : evite qu'un lien copie/partage reste valide
 * indefiniment.
 */
app.post('/api/v1/auth/impersonate-exchange', (req, res) => {
  const { ticket } = req.body || {}
  const entry = ticket ? impersonationTickets.get(ticket) : null
  impersonationTickets.delete(ticket)

  if (!entry || entry.expiresAt < Date.now()) {
    fail(res, 401, 'INVALID_TICKET', "Ce lien d'apercu est invalide ou a expire.")
    return
  }

  const user = users.find((u) => u.id === entry.userId)
  if (!user) {
    fail(res, 404, 'NOT_FOUND', 'Utilisateur introuvable.')
    return
  }
  const business = businesses.find((b) => b.id === user.businessId)

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

/**
 * Changement d'email : applique immediatement apres verification du mot de
 * passe (ce mock n'envoie aucun email reel — voir la note sur
 * `/auth/forgot-password` — donc pas de faux flux de confirmation par lien).
 */
app.post('/api/v1/auth/change-email', requireAuth, (req, res) => {
  const { newEmail, password } = req.body || {}
  if (req.currentUser.password !== password) {
    fail(res, 401, 'INVALID_PASSWORD', 'Mot de passe incorrect.')
    return
  }
  if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    res.status(422).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Donnees invalides.',
      errors: { newEmail: ["Le format de l'email est invalide."] }
    })
    return
  }
  if (users.some((u) => u.id !== req.currentUser.id && u.email.toLowerCase() === newEmail.toLowerCase())) {
    fail(res, 409, 'EMAIL_TAKEN', 'Un compte existe deja avec cet email.')
    return
  }

  req.currentUser.email = newEmail
  req.currentUser.updatedAt = now()
  ok(res, publicUser(req.currentUser))
})

/** Historique de connexion de l'utilisateur courant. */
app.get('/api/v1/users/me/login-history', requireAuth, (req, res) => {
  const entries = userLoginHistory
    .filter((entry) => entry.userId === req.currentUser.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20)
  ok(res, entries)
})

/** Export des donnees personnelles de l'utilisateur courant (droit a l'oubli / RGPD). */
app.get('/api/v1/users/me/export', requireAuth, (req, res) => {
  ok(res, {
    exportedAt: now(),
    user: publicUser(req.currentUser),
    business: { id: req.currentBusiness.id, name: req.currentBusiness.name },
    loginHistory: userLoginHistory.filter((entry) => entry.userId === req.currentUser.id)
  })
})

app.post('/api/v1/users/me/avatar', requireAuth, (req, res) => {
  uploadLogo.single('avatar')(req, res, (err) => {
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
        fail(res, 422, 'FILE_TOO_LARGE', "La photo ne doit pas depasser 2 Mo.")
        return
      }
      fail(res, 422, 'UPLOAD_ERROR', 'Le televersement de la photo a echoue.')
      return
    }
    if (!req.file) {
      fail(res, 422, 'VALIDATION_ERROR', 'Aucun fichier recu.')
      return
    }

    if (req.currentUser.avatarUrl) {
      const oldFilename = req.currentUser.avatarUrl.split('/uploads/')[1]
      if (oldFilename) fs.unlink(path.join(UPLOADS_DIR, oldFilename), () => {})
    }

    req.currentUser.avatarUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
    req.currentUser.updatedAt = now()
    ok(res, publicUser(req.currentUser))
  })
})

/**
 * Suppression du COMPTE INDIVIDUEL de l'utilisateur connecte ("droit a
 * l'oubli"), distincte de la suppression du commerce entier (voir `DELETE
 * /business`). Le proprietaire ne peut pas supprimer son propre compte ainsi
 * (il n'y a pas de transfert de propriete implemente) : il doit utiliser la
 * suppression du commerce depuis les Parametres.
 */
app.delete('/api/v1/users/me', requireAuth, (req, res) => {
  if (req.currentUser.role === 'owner') {
    fail(
      res,
      422,
      'OWNER_CANNOT_SELF_DELETE',
      'Le proprietaire ne peut pas supprimer son compte individuellement : supprimez le commerce depuis les parametres.'
    )
    return
  }

  const userId = req.currentUser.id
  const index = users.findIndex((u) => u.id === userId)
  users.splice(index, 1)
  for (const [token, id] of [...accessTokens.entries()]) {
    if (id === userId) accessTokens.delete(token)
  }
  for (const [token, id] of [...refreshTokens.entries()]) {
    if (id === userId) refreshTokens.delete(token)
  }

  ok(res, null)
})

// --- Clients --------------------------------------------------------------

function matchesSearch(client, search) {
  if (!search) return true
  const needle = search.toLowerCase()
  const haystack = [client.firstName, client.lastName, client.email, client.phone, ...(client.tags || [])]
  return haystack.filter(Boolean).some((value) => value.toLowerCase().includes(needle))
}

/** Solde du (somme des `total - amountPaid`) sur toutes les factures non annulees du client. */
function computeClientOutstandingBalance(clientId) {
  return invoices
    .filter((i) => i.clientId === clientId && i.status !== 'cancelled' && i.status !== 'draft')
    .reduce((sum, i) => sum + Math.max(0, i.total - i.amountPaid), 0)
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
  ok(res, { ...client, outstandingBalance: computeClientOutstandingBalance(client.id) })
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
    notes: payload.notes || undefined,
    tags: Array.isArray(payload.tags) && payload.tags.length > 0 ? payload.tags : undefined,
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

app.post('/api/v1/clients/import', requireAuth, (req, res) => {
  const payloadClients = Array.isArray(req.body?.clients) ? req.body.clients : []
  const errors = []
  let createdCount = 0

  payloadClients.forEach((payload, index) => {
    const rowErrors = validateClientPayload(payload || {}, { partial: false })
    if (Object.keys(rowErrors).length > 0) {
      errors.push({ row: index + 1, message: Object.values(rowErrors).flat().join(' ') })
      return
    }

    const client = {
      id: crypto.randomUUID(),
      businessId: req.currentBusiness.id,
      firstName: String(payload.firstName).trim(),
      lastName: String(payload.lastName).trim(),
      phone: payload.phone || undefined,
      email: payload.email || undefined,
      address: payload.address || undefined,
      city: payload.city || undefined,
      country: payload.country || undefined,
      taxId: payload.taxId || undefined,
      notes: payload.notes || undefined,
      tags: Array.isArray(payload.tags) && payload.tags.length > 0 ? payload.tags : undefined,
      createdAt: now(),
      updatedAt: now()
    }
    clients.push(client)
    createdCount += 1
  })

  if (createdCount > 0) {
    logActivity(
      req.currentBusiness.id,
      'client_created',
      `${createdCount} client(s) importe(s) depuis un fichier CSV`,
      now()
    )
  }

  ok(res, { createdCount, errors })
})

app.post('/api/v1/clients/merge', requireAuth, (req, res) => {
  const { primaryId, duplicateId } = req.body || {}
  if (!primaryId || !duplicateId || primaryId === duplicateId) {
    res.status(422).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Donnees invalides.',
      errors: { duplicateId: ['Deux clients distincts sont requis.'] }
    })
    return
  }

  const primary = clients.find((c) => c.id === primaryId && c.businessId === req.currentBusiness.id)
  const duplicate = clients.find(
    (c) => c.id === duplicateId && c.businessId === req.currentBusiness.id
  )
  if (!primary || !duplicate) {
    fail(res, 404, 'NOT_FOUND', 'Client introuvable.')
    return
  }

  // Reattribue les factures (et donc implicitement leurs paiements, lies a
  // la facture et non directement au client) du doublon vers la fiche
  // conservee, puis supprime le doublon.
  let reassignedInvoices = 0
  invoices.forEach((invoice) => {
    if (invoice.clientId === duplicateId && invoice.businessId === req.currentBusiness.id) {
      invoice.clientId = primaryId
      invoice.updatedAt = now()
      reassignedInvoices += 1
    }
  })

  const duplicateIndex = clients.findIndex((c) => c.id === duplicateId)
  clients.splice(duplicateIndex, 1)

  logActivity(
    req.currentBusiness.id,
    'client_created',
    `Fiches "${duplicate.firstName} ${duplicate.lastName}" et "${primary.firstName} ${primary.lastName}" fusionnees (${reassignedInvoices} facture(s) reattribuee(s))`,
    now()
  )

  ok(res, { ...primary, outstandingBalance: computeClientOutstandingBalance(primary.id) })
})

// --- Produits / services ----------------------------------------------

// --- Categories de produits (arborescence) ---------------------------------

function findCategory(businessId, id) {
  return productCategories.find((c) => c.id === id && c.businessId === businessId)
}

/** Chemin lisible complet d'une categorie (ex: "Vetements > T-shirts"). */
function categoryPathOf(category) {
  if (!category) return undefined
  const segments = [category.name]
  let current = category
  while (current.parentId) {
    const parent = productCategories.find((c) => c.id === current.parentId)
    if (!parent) break
    segments.unshift(parent.name)
    current = parent
  }
  return segments.join(' > ')
}

/** `id` lui-meme et tous ses descendants (utilise pour un filtre incluant les sous-categories). */
function categoryAndDescendantIds(businessId, id) {
  const result = [id]
  const children = productCategories.filter((c) => c.businessId === businessId && c.parentId === id)
  for (const child of children) {
    result.push(...categoryAndDescendantIds(businessId, child.id))
  }
  return result
}

/** Vrai si `candidateId` est `ancestorId` lui-meme ou l'un de ses descendants. */
function isCategoryOrDescendant(businessId, candidateId, ancestorId) {
  let current = findCategory(businessId, candidateId)
  while (current) {
    if (current.id === ancestorId) return true
    if (!current.parentId) return false
    current = findCategory(businessId, current.parentId)
  }
  return false
}

/**
 * Resout un chemin de categorie en texte libre (ex: "Vetements > T-shirts")
 * en `categoryId`, creant chaque segment manquant de la chaine. Utilise
 * uniquement par l'import CSV en masse, pour rester aussi simple qu'avant
 * l'entite `ProductCategory` (pas de selection ligne par ligne).
 */
function findOrCreateCategoryPath(businessId, pathText) {
  const segments = String(pathText || '')
    .split('>')
    .map((s) => s.trim())
    .filter(Boolean)
  if (segments.length === 0) return undefined

  let parentId = undefined
  let category
  for (const segment of segments) {
    category = productCategories.find(
      (c) =>
        c.businessId === businessId &&
        c.parentId === parentId &&
        c.name.toLowerCase() === segment.toLowerCase()
    )
    if (!category) {
      category = {
        id: crypto.randomUUID(),
        businessId,
        name: segment,
        parentId,
        createdAt: now(),
        updatedAt: now()
      }
      productCategories.push(category)
    }
    parentId = category.id
  }
  return category.id
}

function withCategoryPath(product) {
  const category = findCategory(product.businessId, product.categoryId)
  return { ...product, categoryPath: categoryPathOf(category) }
}

function matchesProductSearch(product, search) {
  if (!search) return true
  const needle = search.toLowerCase()
  const categoryPath = categoryPathOf(findCategory(product.businessId, product.categoryId))
  return [product.name, categoryPath, product.sku, product.barcode]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(needle))
}

function validateProductPayload(payload, { partial, businessId }) {
  const errors = {}
  const has = (key) => Object.prototype.hasOwnProperty.call(payload, key)

  if ((!partial || has('name')) && !String(payload.name || '').trim()) {
    errors.name = ['Le nom est requis.']
  }
  if ((!partial || has('categoryId')) && !String(payload.categoryId || '').trim()) {
    errors.categoryId = ['La categorie est requise.']
  } else if (payload.categoryId && !findCategory(businessId, payload.categoryId)) {
    errors.categoryId = ['Categorie introuvable.']
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
  if (has('lowStockThreshold') && payload.lowStockThreshold !== undefined) {
    const threshold = Number(payload.lowStockThreshold)
    if (!Number.isFinite(threshold) || threshold < 0) {
      errors.lowStockThreshold = ['Le seuil doit etre un nombre positif ou nul.']
    }
  }
  if (has('priceBreaks') && Array.isArray(payload.priceBreaks)) {
    const invalid = payload.priceBreaks.some(
      (tier) =>
        !Number.isFinite(Number(tier?.minQuantity)) ||
        Number(tier.minQuantity) <= 0 ||
        !Number.isFinite(Number(tier?.price)) ||
        Number(tier.price) < 0
    )
    if (invalid) {
      errors.priceBreaks = ['Chaque palier doit avoir une quantite et un prix valides.']
    }
  }
  return errors
}

function findProduct(req) {
  return products.find((p) => p.id === req.params.id && p.businessId === req.currentBusiness.id)
}

app.get('/api/v1/products', requireAuth, (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search : ''
  let businessProducts = products.filter(
    (p) => p.businessId === req.currentBusiness.id && matchesProductSearch(p, search)
  )
  if (req.query.categoryId) {
    const allowedIds = new Set(
      categoryAndDescendantIds(req.currentBusiness.id, String(req.query.categoryId))
    )
    businessProducts = businessProducts.filter((p) => allowedIds.has(p.categoryId))
  }
  respondPaginated(res, req, businessProducts.map(withCategoryPath), 'name')
})

app.get('/api/v1/products/:id', requireAuth, (req, res) => {
  const product = findProduct(req)
  if (!product) {
    fail(res, 404, 'NOT_FOUND', 'Produit introuvable.')
    return
  }
  ok(res, withCategoryPath(product))
})

app.post('/api/v1/products', requireAuth, (req, res) => {
  const payload = req.body || {}
  const errors = validateProductPayload(payload, { partial: false, businessId: req.currentBusiness.id })
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
    categoryId: payload.categoryId,
    type,
    price: Number(payload.price),
    taxRate: payload.taxRate !== undefined ? Number(payload.taxRate) : 0,
    sku: payload.sku || undefined,
    stock: type === 'product' && payload.stock !== undefined ? Number(payload.stock) : undefined,
    imageUrl: undefined,
    barcode: payload.barcode || undefined,
    lowStockThreshold:
      payload.lowStockThreshold !== undefined ? Number(payload.lowStockThreshold) : undefined,
    priceBreaks: Array.isArray(payload.priceBreaks) && payload.priceBreaks.length > 0
      ? payload.priceBreaks.map((t) => ({ minQuantity: Number(t.minQuantity), price: Number(t.price) }))
      : undefined,
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
  ok(res, withCategoryPath(product))
})

app.patch('/api/v1/products/:id', requireAuth, (req, res) => {
  const product = findProduct(req)
  if (!product) {
    fail(res, 404, 'NOT_FOUND', 'Produit introuvable.')
    return
  }

  const payload = req.body || {}
  const errors = validateProductPayload(payload, { partial: true, businessId: req.currentBusiness.id })
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
  if (next.lowStockThreshold !== undefined) next.lowStockThreshold = Number(next.lowStockThreshold)
  if (Array.isArray(next.priceBreaks)) {
    next.priceBreaks =
      next.priceBreaks.length > 0
        ? next.priceBreaks.map((t) => ({ minQuantity: Number(t.minQuantity), price: Number(t.price) }))
        : undefined
  }
  if ((next.type ?? product.type) === 'service') next.stock = undefined

  Object.assign(product, next, { updatedAt: now() })
  ok(res, withCategoryPath(product))
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

app.post('/api/v1/products/:id/image', requireAuth, (req, res) => {
  const product = findProduct(req)
  if (!product) {
    fail(res, 404, 'NOT_FOUND', 'Produit introuvable.')
    return
  }

  uploadLogo.single('image')(req, res, (err) => {
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
        fail(res, 422, 'FILE_TOO_LARGE', "L'image ne doit pas depasser 2 Mo.")
        return
      }
      fail(res, 422, 'UPLOAD_ERROR', "Le televersement de l'image a echoue.")
      return
    }
    if (!req.file) {
      fail(res, 422, 'VALIDATION_ERROR', 'Aucun fichier recu.')
      return
    }

    if (product.imageUrl) {
      const oldFilename = product.imageUrl.split('/uploads/')[1]
      if (oldFilename) fs.unlink(path.join(UPLOADS_DIR, oldFilename), () => {})
    }

    product.imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
    product.updatedAt = now()
    ok(res, product)
  })
})

app.get('/api/v1/products/:id/stock-movements', requireAuth, (req, res) => {
  const product = findProduct(req)
  if (!product) {
    fail(res, 404, 'NOT_FOUND', 'Produit introuvable.')
    return
  }
  const movements = productStockMovements
    .filter((m) => m.productId === product.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  respondPaginated(res, req, movements, 'createdAt')
})

app.post('/api/v1/products/:id/stock-adjust', requireAuth, (req, res) => {
  const product = findProduct(req)
  if (!product) {
    fail(res, 404, 'NOT_FOUND', 'Produit introuvable.')
    return
  }
  if (product.type !== 'product') {
    fail(res, 422, 'VALIDATION_ERROR', "Le stock ne s'applique qu'aux produits physiques.")
    return
  }

  const { delta, reason } = req.body || {}
  const parsedDelta = Number(delta)
  if (!Number.isFinite(parsedDelta) || parsedDelta === 0) {
    res.status(422).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Donnees invalides.',
      errors: { delta: ['La variation doit etre un nombre non nul.'] }
    })
    return
  }

  const nextStock = (product.stock ?? 0) + parsedDelta
  if (nextStock < 0) {
    res.status(422).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Donnees invalides.',
      errors: { delta: ['Le stock ne peut pas devenir negatif.'] }
    })
    return
  }

  product.stock = nextStock
  product.updatedAt = now()

  const movement = {
    id: crypto.randomUUID(),
    productId: product.id,
    delta: parsedDelta,
    stockAfter: nextStock,
    reason: String(reason || '').trim() || (parsedDelta > 0 ? 'Reapprovisionnement' : 'Ajustement'),
    createdAt: now()
  }
  productStockMovements.push(movement)

  ok(res, product)
})

app.post('/api/v1/products/import', requireAuth, (req, res) => {
  const payloadProducts = Array.isArray(req.body?.products) ? req.body.products : []
  const errors = []
  let createdCount = 0

  payloadProducts.forEach((payload, index) => {
    // La categorie est saisie en texte libre dans le CSV (chemin eventuellement
    // hierarchique) : on la resout en `categoryId` avant validation, creant
    // chaque segment manquant de la chaine au passage.
    const resolvedPayload = {
      ...payload,
      categoryId: findOrCreateCategoryPath(req.currentBusiness.id, payload?.categoryPath)
    }
    const rowErrors = validateProductPayload(resolvedPayload, {
      partial: false,
      businessId: req.currentBusiness.id
    })
    if (Object.keys(rowErrors).length > 0) {
      errors.push({ row: index + 1, message: Object.values(rowErrors).flat().join(' ') })
      return
    }

    const type = resolvedPayload.type === 'service' ? 'service' : 'product'
    products.push({
      id: crypto.randomUUID(),
      businessId: req.currentBusiness.id,
      name: String(resolvedPayload.name).trim(),
      description: resolvedPayload.description || undefined,
      categoryId: resolvedPayload.categoryId,
      type,
      price: Number(payload.price),
      taxRate: payload.taxRate !== undefined ? Number(payload.taxRate) : 0,
      sku: payload.sku || undefined,
      stock: type === 'product' && payload.stock !== undefined ? Number(payload.stock) : undefined,
      imageUrl: undefined,
      barcode: payload.barcode || undefined,
      createdAt: now(),
      updatedAt: now()
    })
    createdCount += 1
  })

  if (createdCount > 0) {
    logActivity(
      req.currentBusiness.id,
      'product_created',
      `${createdCount} produit(s) importe(s) depuis un fichier CSV`,
      now()
    )
  }

  ok(res, { createdCount, errors })
})

app.get('/api/v1/product-categories', requireAuth, (req, res) => {
  const businessCategories = productCategories.filter((c) => c.businessId === req.currentBusiness.id)
  ok(
    res,
    businessCategories.map((c) => ({ ...c, path: categoryPathOf(c) }))
  )
})

app.post('/api/v1/product-categories', requireAuth, (req, res) => {
  const payload = req.body || {}
  const errors = {}
  if (!String(payload.name || '').trim()) errors.name = ['Le nom est requis.']
  if (payload.parentId && !findCategory(req.currentBusiness.id, payload.parentId)) {
    errors.parentId = ['Categorie parente introuvable.']
  }
  if (Object.keys(errors).length > 0) {
    res
      .status(422)
      .json({ success: false, code: 'VALIDATION_ERROR', message: 'Donnees invalides.', errors })
    return
  }

  const category = {
    id: crypto.randomUUID(),
    businessId: req.currentBusiness.id,
    name: String(payload.name).trim(),
    parentId: payload.parentId || undefined,
    createdAt: now(),
    updatedAt: now()
  }
  productCategories.push(category)
  ok(res, { ...category, path: categoryPathOf(category) })
})

app.patch('/api/v1/product-categories/:id', requireAuth, (req, res) => {
  const category = findCategory(req.currentBusiness.id, req.params.id)
  if (!category) {
    fail(res, 404, 'NOT_FOUND', 'Categorie introuvable.')
    return
  }

  const payload = req.body || {}
  const errors = {}
  if (Object.prototype.hasOwnProperty.call(payload, 'name') && !String(payload.name || '').trim()) {
    errors.name = ['Le nom est requis.']
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'parentId') && payload.parentId) {
    if (!findCategory(req.currentBusiness.id, payload.parentId)) {
      errors.parentId = ['Categorie parente introuvable.']
    } else if (isCategoryOrDescendant(req.currentBusiness.id, payload.parentId, category.id)) {
      errors.parentId = ['Une categorie ne peut pas devenir sa propre descendante.']
    }
  }
  if (Object.keys(errors).length > 0) {
    res
      .status(422)
      .json({ success: false, code: 'VALIDATION_ERROR', message: 'Donnees invalides.', errors })
    return
  }

  if (payload.name !== undefined) category.name = String(payload.name).trim()
  if (Object.prototype.hasOwnProperty.call(payload, 'parentId')) {
    category.parentId = payload.parentId || undefined
  }
  category.updatedAt = now()
  ok(res, { ...category, path: categoryPathOf(category) })
})

app.delete('/api/v1/product-categories/:id', requireAuth, (req, res) => {
  const index = productCategories.findIndex(
    (c) => c.id === req.params.id && c.businessId === req.currentBusiness.id
  )
  if (index === -1) {
    fail(res, 404, 'NOT_FOUND', 'Categorie introuvable.')
    return
  }
  const category = productCategories[index]

  const hasChildren = productCategories.some(
    (c) => c.businessId === req.currentBusiness.id && c.parentId === category.id
  )
  if (hasChildren) {
    fail(
      res,
      422,
      'VALIDATION_ERROR',
      'Cette categorie a des sous-categories : deplacez-les ou supprimez-les avant.'
    )
    return
  }
  const hasProducts = products.some(
    (p) => p.businessId === req.currentBusiness.id && p.categoryId === category.id
  )
  if (hasProducts) {
    fail(
      res,
      422,
      'VALIDATION_ERROR',
      'Cette categorie est utilisee par au moins un produit : reassignez-le avant de la supprimer.'
    )
    return
  }

  productCategories.splice(index, 1)
  ok(res, null)
})

// --- Kits (produits groupes) -----------------------------------------------

function findKit(req) {
  return productKits.find((k) => k.id === req.params.id && k.businessId === req.currentBusiness.id)
}

/** Somme des prix des composants (prix unitaire produit x quantite), en ignorant les produits supprimes. */
function computeKitComputedPrice(kit) {
  return kit.items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId)
    return sum + (product ? product.price * item.quantity : 0)
  }, 0)
}

/**
 * Nombre de kits assemblables avec le stock actuel des composants (minimum
 * de `stock composant / quantite requise`, arrondi a l'entier inferieur).
 * `null` si aucun composant n'a de stock suivi (ex: kit 100% services).
 */
function computeKitAvailableStock(kit) {
  let min = null
  for (const item of kit.items) {
    const product = products.find((p) => p.id === item.productId)
    if (!product || product.stock === undefined) continue
    const possible = Math.floor(product.stock / item.quantity)
    min = min === null ? possible : Math.min(min, possible)
  }
  return min
}

function withKitDetails(kit) {
  const items = kit.items.map((item) => {
    const product = products.find((p) => p.id === item.productId)
    return {
      productId: item.productId,
      quantity: item.quantity,
      productName: product ? product.name : '(produit supprime)',
      unitPrice: product ? product.price : 0,
      taxRate: product ? product.taxRate : 0
    }
  })
  const computedPrice = computeKitComputedPrice(kit)
  return {
    ...kit,
    items,
    computedPrice,
    effectivePrice: kit.customPrice !== undefined ? kit.customPrice : computedPrice,
    availableStock: computeKitAvailableStock(kit)
  }
}

function matchesKitSearch(kit, search) {
  if (!search) return true
  const needle = search.toLowerCase()
  return [kit.name, kit.sku, kit.description]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(needle))
}

function validateKitPayload(payload, { partial, businessId }) {
  const errors = {}
  const has = (key) => Object.prototype.hasOwnProperty.call(payload, key)

  if ((!partial || has('name')) && !String(payload.name || '').trim()) {
    errors.name = ['Le nom est requis.']
  }
  if (!partial || has('items')) {
    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      errors.items = ['Le kit doit contenir au moins un produit.']
    } else {
      const invalid = payload.items.some((item) => {
        const product = products.find((p) => p.id === item?.productId && p.businessId === businessId)
        return !product || !(Number(item.quantity) > 0)
      })
      if (invalid) {
        errors.items = ['Chaque ligne doit referencer un produit existant avec une quantite positive.']
      }
    }
  }
  if (has('customPrice') && payload.customPrice !== undefined && payload.customPrice !== null) {
    const price = Number(payload.customPrice)
    if (!Number.isFinite(price) || price < 0) {
      errors.customPrice = ['Le prix doit etre un nombre positif ou nul.']
    }
  }
  return errors
}

app.get('/api/v1/product-kits', requireAuth, (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search : ''
  const businessKits = productKits.filter(
    (k) => k.businessId === req.currentBusiness.id && matchesKitSearch(k, search)
  )
  respondPaginated(res, req, businessKits.map(withKitDetails), 'name')
})

app.get('/api/v1/product-kits/:id', requireAuth, (req, res) => {
  const kit = findKit(req)
  if (!kit) {
    fail(res, 404, 'NOT_FOUND', 'Kit introuvable.')
    return
  }
  ok(res, withKitDetails(kit))
})

app.post('/api/v1/product-kits', requireAuth, (req, res) => {
  const payload = req.body || {}
  const errors = validateKitPayload(payload, { partial: false, businessId: req.currentBusiness.id })
  if (Object.keys(errors).length > 0) {
    res
      .status(422)
      .json({ success: false, code: 'VALIDATION_ERROR', message: 'Donnees invalides.', errors })
    return
  }

  const kit = {
    id: crypto.randomUUID(),
    businessId: req.currentBusiness.id,
    name: String(payload.name).trim(),
    description: payload.description || undefined,
    sku: payload.sku || undefined,
    items: payload.items.map((item) => ({
      productId: item.productId,
      quantity: Number(item.quantity)
    })),
    customPrice:
      payload.customPrice !== undefined && payload.customPrice !== null
        ? Number(payload.customPrice)
        : undefined,
    isActive: payload.isActive !== false,
    createdAt: now(),
    updatedAt: now()
  }
  productKits.push(kit)
  logActivity(req.currentBusiness.id, 'kit_created', `Nouveau kit cree : ${kit.name}`, kit.createdAt)
  ok(res, withKitDetails(kit))
})

app.patch('/api/v1/product-kits/:id', requireAuth, (req, res) => {
  const kit = findKit(req)
  if (!kit) {
    fail(res, 404, 'NOT_FOUND', 'Kit introuvable.')
    return
  }

  const payload = req.body || {}
  const errors = validateKitPayload(payload, { partial: true, businessId: req.currentBusiness.id })
  if (Object.keys(errors).length > 0) {
    res
      .status(422)
      .json({ success: false, code: 'VALIDATION_ERROR', message: 'Donnees invalides.', errors })
    return
  }

  if (payload.name !== undefined) kit.name = String(payload.name).trim()
  if (payload.description !== undefined) kit.description = payload.description || undefined
  if (payload.sku !== undefined) kit.sku = payload.sku || undefined
  if (Array.isArray(payload.items)) {
    kit.items = payload.items.map((item) => ({
      productId: item.productId,
      quantity: Number(item.quantity)
    }))
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'customPrice')) {
    kit.customPrice =
      payload.customPrice !== undefined && payload.customPrice !== null
        ? Number(payload.customPrice)
        : undefined
  }
  if (payload.isActive !== undefined) kit.isActive = Boolean(payload.isActive)
  kit.updatedAt = now()
  ok(res, withKitDetails(kit))
})

app.delete('/api/v1/product-kits/:id', requireAuth, (req, res) => {
  const index = productKits.findIndex(
    (k) => k.id === req.params.id && k.businessId === req.currentBusiness.id
  )
  if (index === -1) {
    fail(res, 404, 'NOT_FOUND', 'Kit introuvable.')
    return
  }
  productKits.splice(index, 1)
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

/** Ne garde que les champs personnalises complets (label ET valeur non vides). */
function sanitizeCustomFields(value) {
  if (!Array.isArray(value)) return undefined
  const fields = value
    .map((f) => ({ label: String(f?.label || '').trim(), value: String(f?.value || '').trim() }))
    .filter((f) => f.label && f.value)
  return fields.length > 0 ? fields : undefined
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
/**
 * Genere un PDF minimal (texte simple) representant la facture, sans
 * dependance externe. `options.watermark` ajoute un filigrane diagonal
 * semi-transparent (ex: "BROUILLON", "EN RETARD") via un objet ExtGState
 * supplementaire \u2014 le nombre d'objets PDF (et donc la table xref) est
 * calcule dynamiquement pour rester valide avec ou sans filigrane.
 */
function buildInvoicePdfBuffer(lines, options = {}) {
  const { watermark } = options
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

  if (watermark) {
    // Texte gris clair (via ExtGState /GS1, opacite 15%), rotate ~45deg,
    // grande taille, positionne pour traverser la page en diagonale.
    streamParts.push(
      `q /GS1 gs 0.55 0.55 0.55 rg 0.7071 0.7071 -0.7071 0.7071 90 260 cm BT /F1 64 Tf 0 0 Td (${sanitize(watermark)}) Tj ET Q`
    )
  }

  const streamBuf = encode(streamParts.join('\n'))

  const resources = watermark
    ? '/Resources << /Font << /F1 4 0 R >> /ExtGState << /GS1 5 0 R >> >>'
    : '/Resources << /Font << /F1 4 0 R >> >>'
  const contentObjNum = watermark ? 6 : 5

  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R ${resources} /MediaBox [0 0 612 792] /Contents ${contentObjNum} 0 R >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
  ]
  if (watermark) {
    objs.push('<< /Type /ExtGState /ca 0.15 >>')
  }

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
  const streamHeader = encode(`${contentObjNum} 0 obj\n<< /Length ${streamBuf.length} >>\nstream\n`)
  const streamFooter = encode('\nendstream\nendobj\n')
  chunks.push(streamHeader, streamBuf, streamFooter)
  pos += streamHeader.length + streamBuf.length + streamFooter.length

  const totalObjs = objs.length + 1
  const xrefOffset = pos
  let xref = `xref\n0 ${totalObjs + 1}\n0000000000 65535 f \n`
  for (let i = 0; i < totalObjs; i++) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }
  xref += `trailer\n<< /Size ${totalObjs + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  chunks.push(encode(xref))

  return Buffer.concat(chunks)
}

/** Texte du filigrane selon le statut de la facture ; `undefined` = aucun filigrane. */
function invoiceStatusWatermark(status) {
  switch (status) {
    case 'draft':
      return 'BROUILLON'
    case 'overdue':
      return 'EN RETARD'
    case 'cancelled':
      return 'ANNULEE'
    case 'paid':
      return 'PAYEE'
    default:
      return undefined
  }
}

/** Construit les lignes texte + filigrane du PDF d'une facture reelle (persistee). */
function renderInvoicePdfBuffer(invoice, business, client) {
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
  return buildInvoicePdfBuffer(lines, { watermark: invoiceStatusWatermark(invoice.status) })
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
  const pdfBuffer = renderInvoicePdfBuffer(invoice, req.currentBusiness, client)
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${invoice.number}.pdf"`)
  res.send(pdfBuffer)
})

/**
 * Apercu PDF en direct pendant la saisie : memes champs qu'une creation,
 * mais rien n'est persiste (pas de numero attribue, pas de journal
 * d'activite). Filigrane "APERCU" systematique pour ne jamais etre confondu
 * avec le PDF officiel d'une facture reellement enregistree.
 */
app.post('/api/v1/invoices/preview-pdf', requireAuth, (req, res) => {
  const payload = req.body || {}
  const client = clients.find(
    (c) => c.id === payload.clientId && c.businessId === req.currentBusiness.id
  )
  const business = req.currentBusiness
  const currency = business.currency || ''

  const items = (Array.isArray(payload.items) ? payload.items : []).map((item) => {
    const quantity = Number(item.quantity) || 0
    const unitPrice = Number(item.unitPrice) || 0
    return {
      description: String(item.description || '').trim() || 'Article',
      quantity,
      unitPrice,
      taxRate: Number(item.taxRate) || 0,
      total: Math.round(quantity * unitPrice * 100) / 100
    }
  })
  const discountType = payload.discountType === 'fixed' ? 'fixed' : 'percentage'
  const discountValue = Number(payload.discountValue) || 0
  const totals = computeInvoiceTotals(items, discountType, discountValue)

  const lines = [
    'Facture (apercu)',
    business.name,
    `Client: ${client ? `${client.firstName} ${client.lastName}` : 'N/A'}`,
    `Date d'emission: ${String(payload.issueDate || '').slice(0, 10) || '-'}`,
    `Date d'echeance: ${String(payload.dueDate || '').slice(0, 10) || '-'}`,
    '',
    ...items.map(
      (item) =>
        `${item.description}  x${item.quantity}  ${item.unitPrice} ${currency} = ${item.total} ${currency}`
    ),
    '',
    `Sous-total: ${totals.subtotal} ${currency}`,
    `Remise: ${totals.discountAmount} ${currency}`,
    `TVA: ${totals.taxTotal} ${currency}`,
    `Total: ${totals.total} ${currency}`
  ]

  const pdfBuffer = buildInvoicePdfBuffer(lines, { watermark: 'APERCU' })
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', 'inline; filename="apercu.pdf"')
  res.send(pdfBuffer)
})

/** Genere (si besoin) et renvoie le jeton du lien public de consultation de cette facture. */
app.post('/api/v1/invoices/:id/share-link', requireAuth, (req, res) => {
  const invoice = invoices.find(
    (i) => i.id === req.params.id && i.businessId === req.currentBusiness.id
  )
  if (!invoice) {
    fail(res, 404, 'NOT_FOUND', 'Facture introuvable.')
    return
  }
  if (!invoice.shareToken) {
    invoice.shareToken = crypto.randomUUID()
    invoice.updatedAt = now()
  }
  ok(res, { shareToken: invoice.shareToken })
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
    internalNotes: payload.internalNotes || undefined,
    customFields: sanitizeCustomFields(payload.customFields),
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
  if (payload.internalNotes !== undefined) invoice.internalNotes = payload.internalNotes || undefined
  if (payload.customFields !== undefined) invoice.customFields = sanitizeCustomFields(payload.customFields)
  if (payload.status) invoice.status = payload.status

  invoice.updatedAt = now()
  ok(res, withClientName(invoice))
})

app.delete('/api/v1/invoices/:id', requireAuth, (req, res) => {
  const index = invoices.findIndex(
    (i) => i.id === req.params.id && i.businessId === req.currentBusiness.id
  )
  if (index === -1) {
    fail(res, 404, 'NOT_FOUND', 'Facture introuvable.')
    return
  }
  const [deleted] = invoices.splice(index, 1)
  for (let i = invoiceAttachments.length - 1; i >= 0; i--) {
    if (invoiceAttachments[i].invoiceId === deleted.id) {
      const filename = invoiceAttachments[i].url.split('/uploads/')[1]
      if (filename) fs.unlink(path.join(UPLOADS_DIR, filename), () => {})
      invoiceAttachments.splice(i, 1)
    }
  }
  ok(res, null)
})

app.post('/api/v1/invoices/:id/remind', requireAuth, (req, res) => {
  const invoice = invoices.find(
    (i) => i.id === req.params.id && i.businessId === req.currentBusiness.id
  )
  if (!invoice) {
    fail(res, 404, 'NOT_FOUND', 'Facture introuvable.')
    return
  }
  if (!['sent', 'partially_paid', 'overdue'].includes(invoice.status)) {
    res.status(422).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Un rappel ne peut etre envoye que pour une facture envoyee, partiellement payee ou en retard.',
      errors: {}
    })
    return
  }
  if (invoice.total - invoice.amountPaid <= 0) {
    res.status(422).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Cette facture ne presente aucun solde restant.',
      errors: {}
    })
    return
  }

  invoice.lastReminderSentAt = now()
  invoice.updatedAt = invoice.lastReminderSentAt

  const client = clients.find((c) => c.id === invoice.clientId)
  logActivity(
    req.currentBusiness.id,
    'invoice_reminder_sent',
    `Rappel envoye pour la facture ${invoice.number}${client ? ` a ${client.firstName} ${client.lastName}` : ''}`,
    invoice.lastReminderSentAt
  )

  ok(res, withClientName(invoice))
})

// --- Pieces jointes libres --------------------------------------------

app.get('/api/v1/invoices/:id/attachments', requireAuth, (req, res) => {
  const invoice = invoices.find(
    (i) => i.id === req.params.id && i.businessId === req.currentBusiness.id
  )
  if (!invoice) {
    fail(res, 404, 'NOT_FOUND', 'Facture introuvable.')
    return
  }
  const attachments = invoiceAttachments
    .filter((a) => a.invoiceId === invoice.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  ok(res, attachments)
})

app.post('/api/v1/invoices/:id/attachments', requireAuth, (req, res) => {
  const invoice = invoices.find(
    (i) => i.id === req.params.id && i.businessId === req.currentBusiness.id
  )
  if (!invoice) {
    fail(res, 404, 'NOT_FOUND', 'Facture introuvable.')
    return
  }

  uploadAttachment.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        fail(res, 422, 'FILE_TOO_LARGE', 'Le fichier ne doit pas depasser 10 Mo.')
        return
      }
      fail(res, 422, 'UPLOAD_ERROR', "Le televersement du fichier a echoue.")
      return
    }
    if (!req.file) {
      fail(res, 422, 'VALIDATION_ERROR', 'Aucun fichier recu.')
      return
    }

    const attachment = {
      id: crypto.randomUUID(),
      invoiceId: invoice.id,
      filename: req.file.originalname,
      url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`,
      sizeBytes: req.file.size,
      createdAt: now()
    }
    invoiceAttachments.push(attachment)
    ok(res, attachment)
  })
})

app.delete('/api/v1/invoices/:id/attachments/:attachmentId', requireAuth, (req, res) => {
  const invoice = invoices.find(
    (i) => i.id === req.params.id && i.businessId === req.currentBusiness.id
  )
  if (!invoice) {
    fail(res, 404, 'NOT_FOUND', 'Facture introuvable.')
    return
  }
  const index = invoiceAttachments.findIndex(
    (a) => a.id === req.params.attachmentId && a.invoiceId === invoice.id
  )
  if (index === -1) {
    fail(res, 404, 'NOT_FOUND', 'Piece jointe introuvable.')
    return
  }
  const [attachment] = invoiceAttachments.splice(index, 1)
  const filename = attachment.url.split('/uploads/')[1]
  if (filename) fs.unlink(path.join(UPLOADS_DIR, filename), () => {})
  ok(res, null)
})

// --- Lien public de consultation ---------------------------------------
//
// Accessible SANS authentification (visiteur = le client de la facture).
// Ne renvoie jamais `internalNotes` ni aucune donnee autre que ce qui est
// deja destine au client sur la facture elle-meme.

app.get('/api/v1/public/invoices/:token', (req, res) => {
  const invoice = invoices.find((i) => i.shareToken === req.params.token)
  if (!invoice) {
    fail(res, 404, 'NOT_FOUND', 'Lien invalide ou expire.')
    return
  }
  const business = businesses.find((b) => b.id === invoice.businessId)
  const client = clients.find((c) => c.id === invoice.clientId)

  ok(res, {
    number: invoice.number,
    status: invoice.status,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    items: invoice.items,
    subtotal: invoice.subtotal,
    discountAmount: invoice.discountAmount,
    taxTotal: invoice.taxTotal,
    total: invoice.total,
    amountPaid: invoice.amountPaid,
    notes: invoice.notes,
    customFields: invoice.customFields,
    businessName: business ? business.name : '',
    businessEmail: business ? business.email : undefined,
    businessPhone: business ? business.phone : undefined,
    currency: business ? business.currency : '',
    clientName: client ? `${client.firstName} ${client.lastName}` : undefined
  })
})

app.get('/api/v1/public/invoices/:token/pdf', (req, res) => {
  const invoice = invoices.find((i) => i.shareToken === req.params.token)
  if (!invoice) {
    fail(res, 404, 'NOT_FOUND', 'Lien invalide ou expire.')
    return
  }
  const business = businesses.find((b) => b.id === invoice.businessId)
  const client = clients.find((c) => c.id === invoice.clientId)
  const pdfBuffer = renderInvoicePdfBuffer(invoice, business, client)
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${invoice.number}.pdf"`)
  res.send(pdfBuffer)
})

// --- Devis ----------------------------------------------------------------

/** Enrichit un devis avec `clientName`, comme `withClientName` pour les factures. */
function withQuoteClientName(quote) {
  const client = clients.find((c) => c.id === quote.clientId)
  return { ...quote, clientName: client ? `${client.firstName} ${client.lastName}` : undefined }
}

function validateQuotePayload(payload) {
  const errors = {}
  const status = payload.status === 'draft' ? 'draft' : 'sent'

  if (!payload.clientId) errors.clientId = ['Le client est requis.']
  if (!payload.expiryDate) errors.expiryDate = ["La date de validite est requise."]

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

function buildQuoteItems(rawItems) {
  return (rawItems || []).map((item) => {
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
}

app.get('/api/v1/quotes', requireAuth, (req, res) => {
  let businessQuotes = quotes.filter((q) => q.businessId === req.currentBusiness.id)

  const search = typeof req.query.search === 'string' ? req.query.search.toLowerCase() : ''
  if (search) {
    businessQuotes = businessQuotes.filter((quote) => {
      const client = clients.find((c) => c.id === quote.clientId)
      const clientName = client ? `${client.firstName} ${client.lastName}`.toLowerCase() : ''
      return quote.number.toLowerCase().includes(search) || clientName.includes(search)
    })
  }
  if (req.query.status) {
    businessQuotes = businessQuotes.filter((q) => q.status === req.query.status)
  }
  if (req.query.clientId) {
    businessQuotes = businessQuotes.filter((q) => q.clientId === req.query.clientId)
  }

  respondPaginated(res, req, businessQuotes.map(withQuoteClientName), 'issueDate')
})

app.get('/api/v1/quotes/:id', requireAuth, (req, res) => {
  const quote = quotes.find((q) => q.id === req.params.id && q.businessId === req.currentBusiness.id)
  if (!quote) {
    fail(res, 404, 'NOT_FOUND', 'Devis introuvable.')
    return
  }
  ok(res, withQuoteClientName(quote))
})

app.post('/api/v1/quotes', requireAuth, (req, res) => {
  const payload = req.body || {}
  const errors = validateQuotePayload(payload)
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
  const items = buildQuoteItems(payload.items)
  const totals = computeInvoiceTotals(items, discountType, discountValue)

  // Numerotation dediee des devis (serie separee des factures, voir
  // "Parametres" > "Numerotation des devis").
  const quoteSettings = req.currentBusiness.quoteSettings
  const sequenceNumber = quoteSettings.nextNumber
  const number = `${quoteSettings.numberPrefix}${String(sequenceNumber).padStart(quoteSettings.numberPadding, '0')}`
  quoteSettings.nextNumber = sequenceNumber + 1

  const issueDate = payload.issueDate || now()

  const quote = {
    id: crypto.randomUUID(),
    businessId: req.currentBusiness.id,
    clientId: client.id,
    number,
    status,
    issueDate,
    expiryDate: payload.expiryDate,
    items,
    discountType,
    discountValue,
    discountAmount: totals.discountAmount,
    subtotal: totals.subtotal,
    taxTotal: totals.taxTotal,
    total: totals.total,
    notes: payload.notes || undefined,
    convertedInvoiceId: undefined,
    createdAt: now(),
    updatedAt: now()
  }
  quotes.push(quote)

  logActivity(
    req.currentBusiness.id,
    'quote_created',
    `Devis ${quote.number} cree (${client.firstName} ${client.lastName})`,
    quote.createdAt
  )

  ok(res, withQuoteClientName(quote))
})

app.patch('/api/v1/quotes/:id', requireAuth, (req, res) => {
  const quote = quotes.find((q) => q.id === req.params.id && q.businessId === req.currentBusiness.id)
  if (!quote) {
    fail(res, 404, 'NOT_FOUND', 'Devis introuvable.')
    return
  }

  const payload = req.body || {}

  if (quote.status === 'converted') {
    res.status(422).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Un devis converti en facture ne peut plus etre modifie.',
      errors: {}
    })
    return
  }

  const isContentUpdate =
    payload.items !== undefined ||
    payload.discountType !== undefined ||
    payload.discountValue !== undefined
  if (isContentUpdate && quote.status !== 'draft') {
    res.status(422).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Seul un devis en brouillon peut etre modifie en detail.',
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
    quote.clientId = client.id
  }

  if (isContentUpdate) {
    const errors = validateQuotePayload({ ...quote, ...payload })
    if (Object.keys(errors).length > 0) {
      res
        .status(422)
        .json({ success: false, code: 'VALIDATION_ERROR', message: 'Donnees invalides.', errors })
      return
    }

    const discountType = payload.discountType === 'fixed' ? 'fixed' : quote.discountType
    const discountValue =
      payload.discountValue !== undefined ? Number(payload.discountValue) : quote.discountValue
    const items = buildQuoteItems(payload.items || quote.items)
    const totals = computeInvoiceTotals(items, discountType, discountValue)

    quote.items = items
    quote.discountType = discountType
    quote.discountValue = discountValue
    quote.discountAmount = totals.discountAmount
    quote.subtotal = totals.subtotal
    quote.taxTotal = totals.taxTotal
    quote.total = totals.total
  }

  if (payload.issueDate) quote.issueDate = payload.issueDate
  if (payload.expiryDate) quote.expiryDate = payload.expiryDate
  if (payload.notes !== undefined) quote.notes = payload.notes || undefined
  if (payload.status && payload.status !== quote.status) {
    quote.status = payload.status
    if (payload.status === 'sent') {
      logActivity(
        req.currentBusiness.id,
        'quote_sent',
        `Devis ${quote.number} envoye`,
        now()
      )
    }
  }

  quote.updatedAt = now()
  ok(res, withQuoteClientName(quote))
})

app.delete('/api/v1/quotes/:id', requireAuth, (req, res) => {
  const index = quotes.findIndex(
    (q) => q.id === req.params.id && q.businessId === req.currentBusiness.id
  )
  if (index === -1) {
    fail(res, 404, 'NOT_FOUND', 'Devis introuvable.')
    return
  }
  if (quotes[index].status === 'converted') {
    fail(res, 422, 'VALIDATION_ERROR', 'Un devis converti en facture ne peut pas etre supprime.')
    return
  }
  quotes.splice(index, 1)
  ok(res, null)
})

app.post('/api/v1/quotes/:id/convert', requireAuth, (req, res) => {
  const quote = quotes.find((q) => q.id === req.params.id && q.businessId === req.currentBusiness.id)
  if (!quote) {
    fail(res, 404, 'NOT_FOUND', 'Devis introuvable.')
    return
  }
  if (quote.status === 'converted') {
    fail(res, 422, 'VALIDATION_ERROR', 'Ce devis a deja ete converti en facture.')
    return
  }
  if (quote.status === 'declined' || quote.status === 'expired') {
    fail(res, 422, 'VALIDATION_ERROR', 'Un devis refuse ou expire ne peut pas etre converti.')
    return
  }
  if (!quote.items.length) {
    fail(res, 422, 'VALIDATION_ERROR', 'Un devis sans ligne ne peut pas etre converti en facture.')
    return
  }

  const invoiceSettings = req.currentBusiness.invoiceSettings
  const sequenceNumber = invoiceSettings.nextNumber
  const number = `${invoiceSettings.numberPrefix}${String(sequenceNumber).padStart(invoiceSettings.numberPadding, '0')}`
  invoiceSettings.nextNumber = sequenceNumber + 1

  const issueDate = now()
  const dueDate = new Date(
    new Date(issueDate).getTime() + invoiceSettings.defaultPaymentTermDays * 24 * 60 * 60 * 1000
  ).toISOString()

  const invoice = {
    id: crypto.randomUUID(),
    businessId: req.currentBusiness.id,
    clientId: quote.clientId,
    number,
    status: 'sent',
    issueDate,
    dueDate,
    items: quote.items.map((item) => ({ ...item, id: crypto.randomUUID() })),
    discountType: quote.discountType,
    discountValue: quote.discountValue,
    discountAmount: quote.discountAmount,
    subtotal: quote.subtotal,
    taxTotal: quote.taxTotal,
    total: quote.total,
    amountPaid: 0,
    notes: quote.notes,
    createdAt: issueDate,
    updatedAt: issueDate
  }
  invoices.push(invoice)

  quote.status = 'converted'
  quote.convertedInvoiceId = invoice.id
  quote.updatedAt = issueDate

  const client = clients.find((c) => c.id === quote.clientId)
  const clientName = client ? `${client.firstName} ${client.lastName}` : ''
  logActivity(
    req.currentBusiness.id,
    'quote_converted',
    `Devis ${quote.number} converti en facture ${invoice.number} (${clientName})`,
    issueDate
  )
  logActivity(
    req.currentBusiness.id,
    'invoice_created',
    `Facture ${invoice.number} creee depuis le devis ${quote.number} (${clientName})`,
    issueDate
  )

  ok(res, withClientName(invoice))
})

// --- Avoirs / notes de credit ----------------------------------------------

function computeCreditNoteTotals(items) {
  const round = (value) => Math.round((value + Number.EPSILON) * 100) / 100
  const lineTotal = (item) => round((item.quantity || 0) * (item.unitPrice || 0))
  const subtotal = round(items.reduce((sum, item) => sum + lineTotal(item), 0))
  const taxTotal = round(
    items.reduce((sum, item) => sum + lineTotal(item) * ((item.taxRate || 0) / 100), 0)
  )
  return { subtotal, taxTotal, total: round(subtotal + taxTotal) }
}

/** Enrichit un avoir avec `clientName` et `invoiceNumber`, pour l'affichage. */
function withCreditNoteDetails(creditNote) {
  const client = clients.find((c) => c.id === creditNote.clientId)
  const invoice = invoices.find((i) => i.id === creditNote.invoiceId)
  return {
    ...creditNote,
    clientName: client ? `${client.firstName} ${client.lastName}` : undefined,
    invoiceNumber: invoice ? invoice.number : undefined
  }
}

app.get('/api/v1/credit-notes', requireAuth, (req, res) => {
  let businessCreditNotes = creditNotes.filter((cn) => cn.businessId === req.currentBusiness.id)

  if (req.query.clientId) {
    businessCreditNotes = businessCreditNotes.filter((cn) => cn.clientId === req.query.clientId)
  }
  if (req.query.invoiceId) {
    businessCreditNotes = businessCreditNotes.filter((cn) => cn.invoiceId === req.query.invoiceId)
  }

  respondPaginated(res, req, businessCreditNotes.map(withCreditNoteDetails), 'issueDate')
})

app.get('/api/v1/credit-notes/:id', requireAuth, (req, res) => {
  const creditNote = creditNotes.find(
    (cn) => cn.id === req.params.id && cn.businessId === req.currentBusiness.id
  )
  if (!creditNote) {
    fail(res, 404, 'NOT_FOUND', 'Avoir introuvable.')
    return
  }
  ok(res, withCreditNoteDetails(creditNote))
})

app.get('/api/v1/invoices/:invoiceId/credit-notes', requireAuth, (req, res) => {
  const invoice = invoices.find(
    (i) => i.id === req.params.invoiceId && i.businessId === req.currentBusiness.id
  )
  if (!invoice) {
    fail(res, 404, 'NOT_FOUND', 'Facture introuvable.')
    return
  }
  const invoiceCreditNotes = creditNotes.filter((cn) => cn.invoiceId === invoice.id)
  ok(res, invoiceCreditNotes.map(withCreditNoteDetails))
})

app.post('/api/v1/credit-notes', requireAuth, (req, res) => {
  const payload = req.body || {}
  const errors = {}

  if (!payload.invoiceId) errors.invoiceId = ['La facture est requise.']
  if (!String(payload.reason || '').trim()) errors.reason = ['Le motif est requis.']
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
  if (invoice.status === 'draft' || invoice.status === 'cancelled') {
    res.status(422).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Un avoir ne peut etre emis que pour une facture envoyee ou payee.',
      errors: { invoiceId: ['Statut de facture invalide pour un avoir.'] }
    })
    return
  }

  const items = payload.items.map((item) => {
    const quantity = Number(item.quantity) || 0
    const unitPrice = Number(item.unitPrice) || 0
    return {
      id: crypto.randomUUID(),
      description: String(item.description || '').trim(),
      quantity,
      unitPrice,
      taxRate: Number(item.taxRate) || 0,
      total: Math.round(quantity * unitPrice * 100) / 100
    }
  })
  const totals = computeCreditNoteTotals(items)

  // Garde-fou : le cumul des avoirs deja emis pour cette facture, plus ce
  // nouvel avoir, ne doit pas depasser le total de la facture.
  const alreadyCredited = creditNotes
    .filter((cn) => cn.invoiceId === invoice.id)
    .reduce((sum, cn) => sum + cn.total, 0)
  if (alreadyCredited + totals.total > invoice.total + 0.01) {
    res.status(422).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Le montant des avoirs depasserait le total de la facture.',
      errors: { items: ['Montant total des avoirs superieur au montant de la facture.'] }
    })
    return
  }

  const creditNoteSettings = req.currentBusiness.creditNoteSettings
  const sequenceNumber = creditNoteSettings.nextNumber
  const number = `${creditNoteSettings.numberPrefix}${String(sequenceNumber).padStart(creditNoteSettings.numberPadding, '0')}`
  creditNoteSettings.nextNumber = sequenceNumber + 1

  const creditNote = {
    id: crypto.randomUUID(),
    businessId: req.currentBusiness.id,
    invoiceId: invoice.id,
    clientId: invoice.clientId,
    number,
    issueDate: now(),
    items,
    subtotal: totals.subtotal,
    taxTotal: totals.taxTotal,
    total: totals.total,
    reason: String(payload.reason).trim(),
    createdAt: now()
  }
  creditNotes.push(creditNote)

  const client = clients.find((c) => c.id === invoice.clientId)
  logActivity(
    req.currentBusiness.id,
    'credit_note_created',
    `Avoir ${creditNote.number} emis pour la facture ${invoice.number} (${client ? `${client.firstName} ${client.lastName}` : ''})`,
    creditNote.createdAt
  )

  ok(res, withCreditNoteDetails(creditNote))
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

/** Somme des remboursements deja emis sur un paiement donne. */
function computeRefundedAmount(paymentId) {
  return refunds
    .filter((r) => r.paymentId === paymentId)
    .reduce((sum, r) => sum + r.amount, 0)
}

/** Enrichit un paiement avec `refundedAmount` et `invoiceNumber`, donnees de confort calculees cote serveur. */
function withRefundedAmount(payment) {
  const invoice = invoices.find((i) => i.id === payment.invoiceId)
  return {
    ...payment,
    refundedAmount: computeRefundedAmount(payment.id),
    invoiceNumber: invoice ? invoice.number : undefined
  }
}

/**
 * Applique l'encaissement d'un montant a une facture : met a jour le solde
 * paye et deduit le statut qui en resulte. Partagee entre l'enregistrement
 * direct d'un paiement et l'encaissement d'une echeance d'echeancier.
 */
function applyPaymentAmountToInvoice(invoice, amount) {
  invoice.amountPaid = Math.round((invoice.amountPaid + amount) * 100) / 100
  if (invoice.amountPaid >= invoice.total) {
    invoice.status = 'paid'
  } else if (invoice.amountPaid > 0) {
    invoice.status = 'partially_paid'
  }
  invoice.updatedAt = now()
}

app.get('/api/v1/payments', requireAuth, (req, res) => {
  const businessPayments = payments
    .filter((p) => p.businessId === req.currentBusiness.id)
    .map(withRefundedAmount)
  respondPaginated(res, req, businessPayments, 'paidAt')
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
    .map(withRefundedAmount)
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
  applyPaymentAmountToInvoice(invoice, amount)

  const currency = req.currentBusiness.currency || ''
  logActivity(
    req.currentBusiness.id,
    'payment_received',
    `Paiement de ${amount.toLocaleString('fr-FR')} ${currency} recu pour ${invoice.number}`,
    payment.createdAt
  )

  ok(res, withRefundedAmount(payment))
})

app.post('/api/v1/payments/:id/refund', requireAuth, (req, res) => {
  const payment = payments.find(
    (p) => p.id === req.params.id && p.businessId === req.currentBusiness.id
  )
  if (!payment) {
    fail(res, 404, 'NOT_FOUND', 'Paiement introuvable.')
    return
  }

  const payload = req.body || {}
  const errors = {}
  const amount = Number(payload.amount)
  if (!(amount > 0)) errors.amount = ['Le montant doit etre un nombre positif.']
  if (!String(payload.reason || '').trim()) errors.reason = ['Le motif est requis.']
  if (Object.keys(errors).length > 0) {
    res
      .status(422)
      .json({ success: false, code: 'VALIDATION_ERROR', message: 'Donnees invalides.', errors })
    return
  }

  if (payment.status === 'failed') {
    fail(res, 422, 'VALIDATION_ERROR', "Un paiement echoue ne peut pas etre rembourse.")
    return
  }

  const alreadyRefunded = computeRefundedAmount(payment.id)
  const refundable = Math.round((payment.amount - alreadyRefunded) * 100) / 100
  if (amount > refundable + 0.01) {
    res.status(422).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Donnees invalides.',
      errors: { amount: [`Le montant ne peut pas depasser le solde remboursable (${refundable}).`] }
    })
    return
  }

  const refund = {
    id: crypto.randomUUID(),
    businessId: req.currentBusiness.id,
    paymentId: payment.id,
    invoiceId: payment.invoiceId,
    amount,
    reason: String(payload.reason).trim(),
    createdAt: now()
  }
  refunds.push(refund)

  const newRefundedTotal = alreadyRefunded + amount
  if (newRefundedTotal >= payment.amount - 0.01) {
    payment.status = 'refunded'
  }
  payment.updatedAt = now()

  const invoice = invoices.find((i) => i.id === payment.invoiceId)
  if (invoice) {
    invoice.amountPaid = Math.max(0, Math.round((invoice.amountPaid - amount) * 100) / 100)
    if (!['draft', 'cancelled'].includes(invoice.status)) {
      if (invoice.amountPaid <= 0) {
        invoice.status = 'sent'
      } else if (invoice.amountPaid < invoice.total) {
        invoice.status = 'partially_paid'
      }
    }
    invoice.updatedAt = now()
  }

  const currency = req.currentBusiness.currency || ''
  logActivity(
    req.currentBusiness.id,
    'payment_refunded',
    `Remboursement de ${amount.toLocaleString('fr-FR')} ${currency} emis${invoice ? ` pour ${invoice.number}` : ''}`,
    refund.createdAt
  )

  ok(res, withRefundedAmount(payment))
})

// --- Echeanciers de paiement ------------------------------------------------

/** Ajoute le statut "en retard" calcule a la volee (jamais persiste) sur chaque echeance. */
function withDerivedInstallmentStatuses(plan) {
  const nowTime = Date.now()
  return {
    ...plan,
    installments: plan.installments.map((installment) => {
      if (installment.status === 'pending' && new Date(installment.dueDate).getTime() < nowTime) {
        return { ...installment, status: 'overdue' }
      }
      return installment
    })
  }
}

app.get('/api/v1/invoices/:invoiceId/installment-plan', requireAuth, (req, res) => {
  const invoice = invoices.find(
    (i) => i.id === req.params.invoiceId && i.businessId === req.currentBusiness.id
  )
  if (!invoice) {
    fail(res, 404, 'NOT_FOUND', 'Facture introuvable.')
    return
  }
  const plan = installmentPlans.find((p) => p.invoiceId === invoice.id)
  ok(res, plan ? withDerivedInstallmentStatuses(plan) : null)
})

app.post('/api/v1/invoices/:invoiceId/installment-plan', requireAuth, (req, res) => {
  const invoice = invoices.find(
    (i) => i.id === req.params.invoiceId && i.businessId === req.currentBusiness.id
  )
  if (!invoice) {
    fail(res, 404, 'NOT_FOUND', 'Facture introuvable.')
    return
  }
  if (['draft', 'cancelled'].includes(invoice.status)) {
    fail(
      res,
      422,
      'VALIDATION_ERROR',
      'Un echeancier ne peut etre cree que pour une facture envoyee.'
    )
    return
  }
  if (installmentPlans.some((p) => p.invoiceId === invoice.id)) {
    fail(res, 422, 'VALIDATION_ERROR', 'Un echeancier existe deja pour cette facture.')
    return
  }

  const payload = req.body || {}
  const rawInstallments = Array.isArray(payload.installments) ? payload.installments : []
  const errors = {}

  if (rawInstallments.length < 2) {
    errors.installments = ['Un echeancier doit comporter au moins deux echeances.']
  } else if (
    rawInstallments.some((item) => !item.dueDate || !(Number(item.amount) > 0))
  ) {
    errors.installments = ['Chaque echeance doit avoir une date et un montant positif.']
  } else {
    const remainingBalance = Math.round((invoice.total - invoice.amountPaid) * 100) / 100
    const sum = Math.round(
      rawInstallments.reduce((total, item) => total + Number(item.amount), 0) * 100
    ) / 100
    if (Math.abs(sum - remainingBalance) > 0.01) {
      errors.installments = [
        `La somme des echeances (${sum}) doit correspondre au solde restant de la facture (${remainingBalance}).`
      ]
    }
  }

  if (Object.keys(errors).length > 0) {
    res
      .status(422)
      .json({ success: false, code: 'VALIDATION_ERROR', message: 'Donnees invalides.', errors })
    return
  }

  const plan = {
    id: crypto.randomUUID(),
    businessId: req.currentBusiness.id,
    invoiceId: invoice.id,
    installments: rawInstallments.map((item) => ({
      id: crypto.randomUUID(),
      dueDate: item.dueDate,
      amount: Number(item.amount),
      status: 'pending'
    })),
    createdAt: now(),
    updatedAt: now()
  }
  installmentPlans.push(plan)

  logActivity(
    req.currentBusiness.id,
    'installment_plan_created',
    `Echeancier de ${plan.installments.length} echeances cree pour la facture ${invoice.number}`,
    plan.createdAt
  )

  ok(res, withDerivedInstallmentStatuses(plan))
})

app.post(
  '/api/v1/invoices/:invoiceId/installment-plan/:installmentId/pay',
  requireAuth,
  (req, res) => {
    const invoice = invoices.find(
      (i) => i.id === req.params.invoiceId && i.businessId === req.currentBusiness.id
    )
    if (!invoice) {
      fail(res, 404, 'NOT_FOUND', 'Facture introuvable.')
      return
    }
    const plan = installmentPlans.find((p) => p.invoiceId === invoice.id)
    if (!plan) {
      fail(res, 404, 'NOT_FOUND', 'Echeancier introuvable.')
      return
    }
    const installment = plan.installments.find((i) => i.id === req.params.installmentId)
    if (!installment) {
      fail(res, 404, 'NOT_FOUND', 'Echeance introuvable.')
      return
    }
    if (installment.status === 'paid') {
      fail(res, 422, 'VALIDATION_ERROR', 'Cette echeance est deja payee.')
      return
    }

    const payload = req.body || {}
    if (!['cash', 'card', 'bank_transfer', 'mobile_money', 'other'].includes(payload.method)) {
      res.status(422).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Donnees invalides.',
        errors: { method: ['Moyen de paiement invalide.'] }
      })
      return
    }

    const payment = {
      id: crypto.randomUUID(),
      businessId: req.currentBusiness.id,
      invoiceId: invoice.id,
      amount: installment.amount,
      method: payload.method,
      status: 'completed',
      reference: payload.reference || undefined,
      paidAt: payload.paidAt || now(),
      notes: `Echeance d'echeancier (${formatInstallmentLabel(plan, installment)})`,
      createdAt: now(),
      updatedAt: now()
    }
    payments.push(payment)
    applyPaymentAmountToInvoice(invoice, installment.amount)

    installment.status = 'paid'
    installment.paidAt = payment.paidAt
    installment.paymentId = payment.id
    plan.updatedAt = now()

    const currency = req.currentBusiness.currency || ''
    logActivity(
      req.currentBusiness.id,
      'payment_received',
      `Echeance de ${installment.amount.toLocaleString('fr-FR')} ${currency} encaissee pour ${invoice.number}`,
      payment.createdAt
    )

    ok(res, withDerivedInstallmentStatuses(plan))
  }
)

/** Libelle court d'une echeance ("2/4"), pour la note du paiement genere. */
function formatInstallmentLabel(plan, installment) {
  const index = plan.installments.findIndex((i) => i.id === installment.id)
  return `${index + 1}/${plan.installments.length}`
}

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

/**
 * Variation en pourcentage entre deux valeurs (une decimale). `null` quand
 * il n'y a pas de base de comparaison valable (0 sur la periode precedente) :
 * le frontend affiche alors "Nouveau" plutot qu'un pourcentage absurde.
 */
function percentChange(current, previous) {
  if (previous === 0) return current === 0 ? 0 : null
  return Math.round(((current - previous) / previous) * 1000) / 10
}

/**
 * Calcule les indicateurs de la periode precedente (meme duree, juste avant
 * la periode en cours) pour permettre l'affichage d'une variation ("+12 %
 * vs periode precedente") a cote de chaque indicateur cle.
 */
function computeStatsComparison(businessId, period) {
  const currentStats = computeStats(businessId, period)
  const currentStart = getPeriodStart(period)
  const durationMs = Date.now() - currentStart.getTime()
  const previousStart = new Date(currentStart.getTime() - durationMs)
  const previousEnd = currentStart

  const businessInvoices = invoices.filter((i) => i.businessId === businessId)
  const businessPayments = payments.filter((p) => p.businessId === businessId)
  const businessClients = clients.filter((c) => c.businessId === businessId)

  const previousInvoices = businessInvoices.filter((i) => {
    const issueDate = new Date(i.issueDate)
    return issueDate >= previousStart && issueDate < previousEnd
  })
  const previousRevenue = businessPayments
    .filter((p) => {
      const paidAt = new Date(p.paidAt)
      return paidAt >= previousStart && paidAt < previousEnd
    })
    .reduce((sum, p) => sum + p.amount, 0)
  const previousClientsCount = businessClients.filter(
    (c) => new Date(c.createdAt) < previousEnd
  ).length

  return {
    ...currentStats,
    comparison: {
      revenueChangePercent: percentChange(currentStats.revenueTotal, previousRevenue),
      invoicesChangePercent: percentChange(currentStats.invoicesCount, previousInvoices.length),
      clientsChangePercent: percentChange(businessClients.length, previousClientsCount)
    }
  }
}

/**
 * Nombre de jours couverts par une periode, utilise pour calculer la
 * fenetre "periode precedente" de meme duree (voir `/reports/revenue-comparison`).
 */
function getPeriodWindowDays(period) {
  return { today: 1, '7d': 7, '30d': 30, '3m': 91, year: 365 }[period] ?? 30
}

/**
 * `referenceDate` (par defaut aujourd'hui) sert de point d'ancrage "fin de
 * fenetre" : la comparaison periode precedente reutilise cette meme fonction
 * en decalant simplement la reference dans le passe, sans dupliquer la
 * logique de decoupage en buckets.
 */
function buildRevenueBuckets(period, businessPayments, referenceDate = new Date()) {
  const buckets = []
  const nowDate = referenceDate

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
  ok(res, computeStatsComparison(req.currentBusiness.id, period))
})

// Seuil par defaut au-dela duquel un produit physique est considere en
// stock bas, applique quand le produit n'a pas son propre
// `lowStockThreshold` (voir module Produits).
const DEFAULT_LOW_STOCK_THRESHOLD = 5
// Nombre de jours avant renouvellement/fin d'essai a partir duquel on alerte.
const SUBSCRIPTION_EXPIRY_WARNING_DAYS = 7

function isLowStock(product) {
  if (typeof product.stock !== 'number') return false
  const threshold = product.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD
  return product.stock <= threshold
}

app.get('/api/v1/dashboard/alerts', requireAuth, (req, res) => {
  const businessId = req.currentBusiness.id

  const overdueInvoicesAll = invoices
    .filter((i) => i.businessId === businessId && i.status === 'overdue')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  const overdueInvoices = overdueInvoicesAll.slice(0, 5).map((invoice) => {
    const client = clients.find((c) => c.id === invoice.clientId)
    return {
      id: invoice.id,
      number: invoice.number,
      clientName: client ? `${client.firstName} ${client.lastName}` : 'Client supprime',
      balance: Math.round((invoice.total - invoice.amountPaid) * 100) / 100,
      dueDate: invoice.dueDate
    }
  })

  const lowStockAll = products
    .filter((p) => p.businessId === businessId && p.type === 'product' && isLowStock(p))
    .sort((a, b) => a.stock - b.stock)
  const lowStockProducts = lowStockAll
    .slice(0, 5)
    .map((p) => ({ id: p.id, name: p.name, stock: p.stock }))

  const subscriptionRecord = subscriptions.find((s) => s.businessId === businessId)
  let subscriptionDaysRemaining = null
  let subscriptionExpiringSoon = false
  if (subscriptionRecord && ['trial', 'active', 'past_due'].includes(subscriptionRecord.status)) {
    const msRemaining = new Date(subscriptionRecord.currentPeriodEnd).getTime() - Date.now()
    subscriptionDaysRemaining = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)))
    subscriptionExpiringSoon = subscriptionDaysRemaining <= SUBSCRIPTION_EXPIRY_WARNING_DAYS
  }

  ok(res, {
    overdueInvoicesCount: overdueInvoicesAll.length,
    overdueInvoices,
    lowStockCount: lowStockAll.length,
    lowStockProducts,
    subscriptionExpiringSoon,
    subscriptionDaysRemaining
  })
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

/**
 * Meme decoupage en buckets que `/reports/revenue`, mais pour la fenetre de
 * meme duree immediatement precedente : permet au frontend de superposer
 * "periode courante" vs "periode precedente" sur un meme graphique.
 */
app.get('/api/v1/reports/revenue-comparison', requireAuth, (req, res) => {
  const { period, qualifyingPayments } = getReportContext(req.currentBusiness.id, req.query)
  const windowDays = getPeriodWindowDays(period)
  const previousReferenceDate = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000)
  ok(res, buildRevenueBuckets(period, qualifyingPayments, previousReferenceDate))
})

/**
 * TVA collectee sur la periode, ventilee par taux : pour chaque ligne de
 * chaque facture qualifiante (emise, hors brouillon/annulee), la remise
 * globale de la facture est repartie au prorata (meme logique que
 * `computeInvoiceTotals` cote frontend) avant application du taux propre a
 * la ligne, afin de rester correct meme si une facture melange plusieurs
 * taux de TVA.
 */
app.get('/api/v1/reports/vat', requireAuth, (req, res) => {
  const { periodInvoices } = getReportContext(req.currentBusiness.id, req.query)
  const qualifying = periodInvoices.filter((i) => SALES_STATUSES.includes(i.status))

  const totalsByRate = new Map()
  qualifying.forEach((invoice) => {
    const discountRatio = invoice.subtotal > 0 ? invoice.discountAmount / invoice.subtotal : 0
    invoice.items.forEach((item) => {
      const lineTotal = Math.round(item.quantity * item.unitPrice * 100) / 100
      const taxableLineAmount = lineTotal * (1 - discountRatio)
      const taxAmount = taxableLineAmount * (item.taxRate / 100)
      const current = totalsByRate.get(item.taxRate) || { taxRate: item.taxRate, taxableAmount: 0, taxAmount: 0 }
      current.taxableAmount += taxableLineAmount
      current.taxAmount += taxAmount
      totalsByRate.set(item.taxRate, current)
    })
  })

  const round = (v) => Math.round((v + Number.EPSILON) * 100) / 100
  const items = Array.from(totalsByRate.values())
    .map((item) => ({
      taxRate: item.taxRate,
      taxableAmount: round(item.taxableAmount),
      taxAmount: round(item.taxAmount)
    }))
    .sort((a, b) => a.taxRate - b.taxRate)

  ok(res, {
    items,
    totalTaxableAmount: round(items.reduce((sum, i) => sum + i.taxableAmount, 0)),
    totalTaxAmount: round(items.reduce((sum, i) => sum + i.taxAmount, 0))
  })
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
  const department = typeof req.query.department === 'string' ? req.query.department : ''
  let businessUsers = users.filter(
    (u) => u.businessId === req.currentBusiness.id && matchesUserSearch(u, search)
  )
  if (department) {
    const needle = department.toLowerCase()
    businessUsers = businessUsers.filter((u) => (u.department || '').toLowerCase().includes(needle))
  }
  respondPaginated(res, req, businessUsers.map(publicUser), 'firstName')
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
    department: String(payload.department || '').trim() || undefined,
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
  if (Object.prototype.hasOwnProperty.call(payload, 'permissions')) {
    const validPermissions = new Set(OWNER_PERMISSIONS)
    if (
      !Array.isArray(payload.permissions) ||
      payload.permissions.some((p) => !validPermissions.has(p))
    ) {
      errors.permissions = ['Liste de permissions invalide.']
    }
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
  // Traite separement de `role` : permet d'affiner la matrice de
  // permissions d'un utilisateur au-dela du jeu par defaut de son role
  // (voir "Equipe" > matrice editable). Si les deux sont fournis dans la
  // meme requete, la liste explicite de permissions prevaut.
  if (Object.prototype.hasOwnProperty.call(payload, 'permissions')) {
    user.permissions = payload.permissions
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'isActive')) {
    user.isActive = Boolean(payload.isActive)
  }
  if (payload.firstName) user.firstName = payload.firstName.trim()
  if (payload.lastName) user.lastName = payload.lastName.trim()
  if (Object.prototype.hasOwnProperty.call(payload, 'phone')) user.phone = payload.phone || undefined
  if (Object.prototype.hasOwnProperty.call(payload, 'department')) {
    user.department = String(payload.department || '').trim() || undefined
  }
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
  if (has('monthlyRevenueTarget') && payload.monthlyRevenueTarget !== null) {
    const target = Number(payload.monthlyRevenueTarget)
    if (!Number.isFinite(target) || target <= 0) {
      errors.monthlyRevenueTarget = ['L\'objectif doit etre un nombre positif, ou vide pour le retirer.']
    }
  }

  if (has('webhookUrl') && payload.webhookUrl) {
    if (!/^https?:\/\/.+/.test(payload.webhookUrl)) {
      errors.webhookUrl = ['URL de webhook invalide (doit commencer par http:// ou https://).']
    }
  }
  if (has('webhookEvents') && payload.webhookEvents !== undefined) {
    if (!Array.isArray(payload.webhookEvents) || payload.webhookEvents.some((e) => typeof e !== 'string')) {
      errors.webhookEvents = ["Liste d'evenements invalide."]
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

app.post('/api/v1/business/stamp', requireAuth, requirePermission('settings:manage'), (req, res) => {
  uploadLogo.single('stamp')(req, res, (err) => {
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
        fail(res, 422, 'FILE_TOO_LARGE', 'Le tampon ne doit pas depasser 2 Mo.')
        return
      }
      fail(res, 422, 'UPLOAD_ERROR', 'Le televersement du tampon a echoue.')
      return
    }
    if (!req.file) {
      fail(res, 422, 'VALIDATION_ERROR', 'Aucun fichier recu.')
      return
    }

    const business = req.currentBusiness
    if (business.stampUrl) {
      const oldFilename = business.stampUrl.split('/uploads/')[1]
      if (oldFilename) {
        fs.unlink(path.join(UPLOADS_DIR, oldFilename), () => {})
      }
    }

    business.stampUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
    business.updatedAt = now()
    ok(res, business)
  })
})

/**
 * Cle API developpeur factice : ce serveur ne consomme jamais cette cle
 * lui-meme (pas de mecanisme d'authentification par cle API implemente ici)
 * — elle sert uniquement de gabarit pour une future integration cote
 * backend de production.
 */
app.post(
  '/api/v1/business/api-key/regenerate',
  requireAuth,
  requirePermission('settings:manage'),
  (req, res) => {
    const business = req.currentBusiness
    business.apiKey = `fia_${crypto.randomUUID().replace(/-/g, '')}`
    business.updatedAt = now()
    ok(res, business)
  }
)

/** Export complet des donnees du commerce, pour une sauvegarde manuelle self-service. */
app.get('/api/v1/business/export', requireAuth, requirePermission('settings:manage'), (req, res) => {
  const businessId = req.currentBusiness.id
  ok(res, {
    exportedAt: now(),
    business: req.currentBusiness,
    clients: clients.filter((c) => c.businessId === businessId),
    products: products.filter((p) => p.businessId === businessId),
    invoices: invoices.filter((i) => i.businessId === businessId),
    quotes: quotes.filter((q) => q.businessId === businessId),
    creditNotes: creditNotes.filter((cn) => cn.businessId === businessId),
    payments: payments.filter((p) => p.businessId === businessId),
    users: users.filter((u) => u.businessId === businessId).map(publicUser)
  })
})

/**
 * Supprime en cascade toutes les donnees rattachees a un commerce (isolation
 * multi-tenant oblige) et revoque les jetons de ses utilisateurs. Partagee
 * entre la suppression self-service (commercant) et la suppression
 * definitive depuis l'espace admin.
 */
function deleteBusinessCascade(businessId) {
  const businessUserIds = new Set(
    users.filter((u) => u.businessId === businessId).map((u) => u.id)
  )

  const removeAll = (arr, predicate) => {
    for (let i = arr.length - 1; i >= 0; i--) {
      if (predicate(arr[i])) arr.splice(i, 1)
    }
  }

  removeAll(clients, (c) => c.businessId === businessId)
  removeAll(products, (p) => p.businessId === businessId)
  removeAll(productCategories, (c) => c.businessId === businessId)
  removeAll(productKits, (k) => k.businessId === businessId)
  removeAll(productStockMovements, (m) => m.businessId === businessId)
  removeAll(invoiceAttachments, (a) => invoices.some((i) => i.id === a.invoiceId && i.businessId === businessId))
  removeAll(invoices, (i) => i.businessId === businessId)
  removeAll(quotes, (q) => q.businessId === businessId)
  removeAll(creditNotes, (cn) => cn.businessId === businessId)
  removeAll(payments, (p) => p.businessId === businessId)
  removeAll(refunds, (r) => r.businessId === businessId)
  removeAll(installmentPlans, (p) => p.businessId === businessId)
  removeAll(subscriptions, (s) => s.businessId === businessId)
  removeAll(activities, (a) => a.businessId === businessId)
  removeAll(adminAuditLog, (a) => a.businessId === businessId)
  removeAll(users, (u) => u.businessId === businessId)
  removeAll(businesses, (b) => b.id === businessId)

  for (const [token, userId] of [...accessTokens.entries()]) {
    if (businessUserIds.has(userId)) accessTokens.delete(token)
  }
  for (const [token, userId] of [...refreshTokens.entries()]) {
    if (businessUserIds.has(userId)) refreshTokens.delete(token)
  }
}

/**
 * Suppression self-service du compte commerce : reservee au proprietaire,
 * exige la saisie exacte du nom du commerce en confirmation, et supprime en
 * cascade toutes les donnees rattachees (isolation multi-tenant oblige).
 */
app.delete('/api/v1/business', requireAuth, (req, res) => {
  if (req.currentUser.role !== 'owner') {
    fail(res, 403, 'FORBIDDEN', 'Seul le proprietaire du commerce peut supprimer le compte.')
    return
  }

  const business = req.currentBusiness
  const confirmName = String((req.body && req.body.confirmName) || '')
  if (confirmName !== business.name) {
    res.status(422).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Donnees invalides.',
      errors: { confirmName: ['Le nom saisi ne correspond pas au nom du commerce.'] }
    })
    return
  }

  logPlatformEvent('business_self_deleted', `Commerce ferme par son proprietaire : ${business.name}`)
  deleteBusinessCascade(business.id)
  ok(res, null)
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

/**
 * Historique de facturation SaaS : ce mock ne conserve pas de journal reel
 * des cycles factures (pas de moteur de paiement recurrent) — on derive donc
 * une ligne par periode de facturation ecoulee depuis la creation de
 * l'abonnement, au tarif actuel du plan (remise courante appliquee). Les
 * periodes a tarif nul (plan Free) ne generent pas de recu.
 */
function computeSubscriptionInvoiceHistory(record) {
  const plan = resolvePlan(record.planId)
  if (!plan || plan.price <= 0) return []

  const cycleDays = plan.billingCycle === 'yearly' ? 365 : 30
  const cycleMs = cycleDays * 24 * 60 * 60 * 1000
  const start = new Date(record.createdAt).getTime()
  const elapsed = Date.now() - start
  const periodsElapsed = Math.min(24, Math.max(0, Math.floor(elapsed / cycleMs) + 1))
  const amount =
    record.discountPercent
      ? Math.round((plan.price * (1 - record.discountPercent / 100)) * 100) / 100
      : plan.price

  const rows = []
  for (let i = 0; i < periodsElapsed; i++) {
    rows.push({
      id: `${record.id}-${i}`,
      businessId: record.businessId,
      planName: plan.name,
      amount,
      currency: 'XOF',
      billingCycle: plan.billingCycle,
      issuedAt: new Date(start + i * cycleMs).toISOString()
    })
  }
  return rows.reverse()
}

app.get(
  '/api/v1/subscription/invoices',
  requireAuth,
  requirePermission('subscription:read'),
  (req, res) => {
    const record = subscriptions.find((s) => s.businessId === req.currentBusiness.id)
    if (!record) {
      fail(res, 404, 'NOT_FOUND', 'Abonnement introuvable.')
      return
    }
    ok(res, computeSubscriptionInvoiceHistory(record))
  }
)

app.get(
  '/api/v1/subscription/invoices/:id/receipt',
  requireAuth,
  requirePermission('subscription:read'),
  (req, res) => {
    const record = subscriptions.find((s) => s.businessId === req.currentBusiness.id)
    if (!record) {
      fail(res, 404, 'NOT_FOUND', 'Abonnement introuvable.')
      return
    }
    const row = computeSubscriptionInvoiceHistory(record).find((r) => r.id === req.params.id)
    if (!row) {
      fail(res, 404, 'NOT_FOUND', 'Recu introuvable.')
      return
    }

    const business = req.currentBusiness
    const lines = [
      'Recu d\'abonnement Facture IA',
      business.name,
      `Plan : ${row.planName} (${row.billingCycle === 'yearly' ? 'annuel' : 'mensuel'})`,
      `Date : ${row.issuedAt.slice(0, 10)}`,
      '',
      `Montant : ${row.amount} ${row.currency}`
    ]
    const pdfBuffer = buildInvoicePdfBuffer(lines)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="recu-${row.id}.pdf"`)
    res.send(pdfBuffer)
  }
)

app.post(
  '/api/v1/subscription/change-plan',
  requireAuth,
  requirePermission('subscription:manage'),
  (req, res) => {
    const { planId, promoCode } = req.body || {}
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

    // Resout le code saisi : soit un code promo statique, soit le code de
    // parrainage d'un AUTRE commerce (jamais le sien).
    let discountPercent
    let normalizedCode
    if (promoCode && String(promoCode).trim()) {
      normalizedCode = String(promoCode).trim().toUpperCase()
      const referringBusiness = businesses.find(
        (b) => b.referralCode === normalizedCode && b.id !== req.currentBusiness.id
      )
      if (Object.prototype.hasOwnProperty.call(PROMO_CODES, normalizedCode)) {
        discountPercent = PROMO_CODES[normalizedCode]
      } else if (referringBusiness) {
        discountPercent = REFERRAL_DISCOUNT_PERCENT
        referringBusiness.referralRedemptions = (referringBusiness.referralRedemptions || 0) + 1
      } else {
        res.status(422).json({
          success: false,
          code: 'VALIDATION_ERROR',
          message: 'Donnees invalides.',
          errors: { promoCode: ['Code promo ou de parrainage invalide.'] }
        })
        return
      }
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
    if (discountPercent !== undefined) {
      record.promoCode = normalizedCode
      record.discountPercent = discountPercent
    }
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

/** Chiffre d'affaires total facture par ce commerce a SES clients (paiements encaisses). */
function computeBusinessRevenueTotal(businessId) {
  return payments
    .filter((p) => p.businessId === businessId && p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0)
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
    planId: subscriptionRecord ? subscriptionRecord.planId : undefined,
    planName: plan ? plan.name : 'Aucun',
    revenueTotal: computeBusinessRevenueTotal(business.id),
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

  adminLoginHistory.push({
    id: crypto.randomUUID(),
    adminId: admin.id,
    adminName: `${admin.firstName} ${admin.lastName}`,
    ipAddress: req.ip || req.socket?.remoteAddress || 'inconnue',
    createdAt: now()
  })

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
  const planFilter = typeof req.query.planId === 'string' ? req.query.planId : ''
  const dateFrom = typeof req.query.dateFrom === 'string' ? req.query.dateFrom : ''
  const dateTo = typeof req.query.dateTo === 'string' ? req.query.dateTo : ''
  const minRevenue = req.query.minRevenue !== undefined ? Number(req.query.minRevenue) : undefined
  const maxRevenue = req.query.maxRevenue !== undefined ? Number(req.query.maxRevenue) : undefined

  const summaries = businesses
    .map(serializeAdminBusinessSummary)
    .filter((summary) => {
      const matchesSearch =
        !search ||
        summary.name.toLowerCase().includes(search) ||
        summary.ownerEmail.toLowerCase().includes(search) ||
        summary.ownerName.toLowerCase().includes(search)
      const matchesStatus = !statusFilter || summary.subscriptionStatus === statusFilter
      const matchesPlan = !planFilter || summary.planId === planFilter
      const matchesDateFrom = !dateFrom || summary.createdAt >= dateFrom
      const matchesDateTo = !dateTo || summary.createdAt <= dateTo
      const matchesMinRevenue = minRevenue === undefined || summary.revenueTotal >= minRevenue
      const matchesMaxRevenue = maxRevenue === undefined || summary.revenueTotal <= maxRevenue
      return (
        matchesSearch &&
        matchesStatus &&
        matchesPlan &&
        matchesDateFrom &&
        matchesDateTo &&
        matchesMinRevenue &&
        matchesMaxRevenue
      )
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

/**
 * Suppression definitive d'un commerce depuis l'espace admin, au-dela de la
 * suspension : exige la saisie exacte du nom du commerce en confirmation
 * (meme garde-fou que la suppression self-service), journalisee AVANT
 * suppression (le journal du commerce disparait avec lui).
 */
app.delete('/api/v1/admin/businesses/:id', requireAdminAuth, (req, res) => {
  const business = findBusinessOr404(req, res)
  if (!business) return

  const confirmName = String((req.body && req.body.confirmName) || '')
  if (confirmName !== business.name) {
    res.status(422).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Donnees invalides.',
      errors: { confirmName: ['Le nom saisi ne correspond pas au nom du commerce.'] }
    })
    return
  }

  deleteBusinessCascade(business.id)
  ok(res, null)
})

/**
 * Mode "apercu" : genere un ticket a usage unique et courte duree de vie,
 * echangeable (voir `/auth/impersonate-exchange`) contre une VRAIE session
 * commercant (jetons du realm tenant), au nom du proprietaire du commerce.
 * L'admin n'obtient jamais directement les jetons commercant lui-meme :
 * seul le navigateur qui echange le ticket les recoit, et le ticket est
 * a usage unique (protege contre le partage accidentel de l'URL).
 */
app.post('/api/v1/admin/businesses/:id/impersonate', requireAdminAuth, (req, res) => {
  const business = findBusinessOr404(req, res)
  if (!business) return

  const owner = findBusinessOwner(business.id)
  if (!owner) {
    fail(res, 404, 'NOT_FOUND', 'Aucun proprietaire trouve pour ce commerce.')
    return
  }

  const ticket = crypto.randomUUID()
  impersonationTickets.set(ticket, {
    userId: owner.id,
    expiresAt: Date.now() + 60 * 1000
  })

  logAdminAction(
    req.currentAdmin,
    business,
    'business_previewed',
    `Apercu du compte lance par ${req.currentAdmin.firstName} ${req.currentAdmin.lastName}`
  )

  ok(res, { ticket })
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

// --- Gestion des administrateurs (super-admin uniquement pour les mutations) ---

function publicAdminSummary(admin) {
  const { password, ...rest } = admin
  return rest
}

app.get('/api/v1/admin/admins', requireAdminAuth, (_req, res) => {
  ok(
    res,
    platformAdmins.map(publicAdminSummary)
  )
})

function validateAdminInvitePayload(payload) {
  const errors = {}
  if (!String(payload.firstName || '').trim()) errors.firstName = ['Le prenom est requis.']
  if (!String(payload.lastName || '').trim()) errors.lastName = ['Le nom est requis.']
  if (!String(payload.email || '').trim()) {
    errors.email = ["L'email est requis."]
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    errors.email = ["Le format de l'email est invalide."]
  }
  if (payload.role && !['super_admin', 'support'].includes(payload.role)) {
    errors.role = ['Role invalide.']
  }
  return errors
}

app.post('/api/v1/admin/admins', requireAdminAuth, requireSuperAdmin, (req, res) => {
  const payload = req.body || {}
  const errors = validateAdminInvitePayload(payload)
  if (Object.keys(errors).length > 0) {
    res
      .status(422)
      .json({ success: false, code: 'VALIDATION_ERROR', message: 'Donnees invalides.', errors })
    return
  }
  if (platformAdmins.some((a) => a.email.toLowerCase() === String(payload.email).toLowerCase())) {
    fail(res, 409, 'EMAIL_TAKEN', 'Un administrateur existe deja avec cet email.')
    return
  }

  const admin = {
    id: crypto.randomUUID(),
    firstName: payload.firstName.trim(),
    lastName: payload.lastName.trim(),
    email: payload.email.trim(),
    password: crypto.randomUUID(), // pas de flux d'invitation par email dans ce serveur factice
    role: payload.role === 'super_admin' ? 'super_admin' : 'support',
    isActive: true,
    createdAt: now(),
    updatedAt: now()
  }
  platformAdmins.push(admin)
  ok(res, publicAdminSummary(admin))
})

app.patch('/api/v1/admin/admins/:id', requireAdminAuth, requireSuperAdmin, (req, res) => {
  const admin = platformAdmins.find((a) => a.id === req.params.id)
  if (!admin) {
    fail(res, 404, 'NOT_FOUND', 'Administrateur introuvable.')
    return
  }
  if (admin.id === req.currentAdmin.id) {
    fail(res, 422, 'SELF_ACTION_FORBIDDEN', 'Vous ne pouvez pas modifier votre propre compte ici.')
    return
  }

  const payload = req.body || {}
  if (payload.role && !['super_admin', 'support'].includes(payload.role)) {
    res.status(422).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Donnees invalides.',
      errors: { role: ['Role invalide.'] }
    })
    return
  }

  if (payload.role) admin.role = payload.role
  if (Object.prototype.hasOwnProperty.call(payload, 'isActive')) {
    admin.isActive = Boolean(payload.isActive)
    if (!admin.isActive) {
      for (const [token, adminId] of [...adminAccessTokens.entries()]) {
        if (adminId === admin.id) adminAccessTokens.delete(token)
      }
      for (const [token, adminId] of [...adminRefreshTokens.entries()]) {
        if (adminId === admin.id) adminRefreshTokens.delete(token)
      }
    }
  }
  admin.updatedAt = now()

  ok(res, publicAdminSummary(admin))
})

/** Historique de connexion de tous les administrateurs (qui, quand). */
app.get('/api/v1/admin/admins/login-history', requireAdminAuth, (req, res) => {
  const sorted = [...adminLoginHistory].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  respondPaginated(res, req, sorted, 'createdAt')
})

// --- Journal d'audit global (toutes actions, tous commerces) ------------

app.get('/api/v1/admin/audit-log', requireAdminAuth, (req, res) => {
  const sorted = [...adminAuditLog].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  respondPaginated(res, req, sorted, 'createdAt')
})

// --- Notifications admin (evenements plateforme) -------------------------

/** Enregistre un evenement plateforme notifiable aux admins (nouveau commerce, nouveau ticket...). */
function logPlatformEvent(type, message) {
  platformEvents.push({ id: crypto.randomUUID(), type, message, createdAt: now() })
}

app.get('/api/v1/admin/notifications', requireAdminAuth, (req, res) => {
  const limit = Math.max(1, Number(req.query.limit) || 15)
  const sorted = [...platformEvents]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)
  ok(res, sorted)
})

// --- Remise administrative sur un commerce --------------------------------

/**
 * Applique une remise a l'abonnement d'un commerce, a l'initiative de
 * l'admin (distinct du code promo self-service : ici pas de code saisi par
 * le commercant, juste une decision commerciale de l'admin).
 */
app.post('/api/v1/admin/businesses/:id/discount', requireAdminAuth, (req, res) => {
  const business = findBusinessOr404(req, res)
  if (!business) return

  const discountPercent = Number((req.body || {}).discountPercent)
  if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
    res.status(422).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Donnees invalides.',
      errors: { discountPercent: ['La remise doit etre comprise entre 0 et 100.'] }
    })
    return
  }

  const record = subscriptions.find((s) => s.businessId === business.id)
  if (!record) {
    fail(res, 404, 'NOT_FOUND', 'Abonnement introuvable.')
    return
  }

  record.discountPercent = discountPercent
  record.promoCode = `ADMIN-${req.currentAdmin.firstName.toUpperCase()}`
  record.updatedAt = now()

  logAdminAction(
    req.currentAdmin,
    business,
    'discount_applied',
    `Remise de ${discountPercent}% appliquee par ${req.currentAdmin.firstName} ${req.currentAdmin.lastName}`
  )

  ok(res, serializeAdminBusinessDetail(business))
})

// --- Finance & analytics plateforme ---------------------------------------

/** Tendance du MRR sur les N derniers mois (approximation : prix du plan actuel de chaque abonnement, compte des son inscription). */
app.get('/api/v1/admin/analytics/mrr-trend', requireAdminAuth, (_req, res) => {
  const months = 6
  const points = []
  const nowDate = new Date()

  for (let i = months - 1; i >= 0; i--) {
    const monthStart = new Date(nowDate.getFullYear(), nowDate.getMonth() - i, 1)
    const monthEnd = new Date(nowDate.getFullYear(), nowDate.getMonth() - i + 1, 1)
    let mrr = 0
    for (const record of subscriptions) {
      if (new Date(record.createdAt) >= monthEnd) continue // pas encore inscrit ce mois-la
      if (!['active', 'past_due'].includes(record.status)) continue
      const plan = resolvePlan(record.planId)
      if (!plan) continue
      const monthlyEquivalent = plan.billingCycle === 'yearly' ? plan.price / 12 : plan.price
      mrr += monthlyEquivalent
    }
    points.push({ month: monthStart.toISOString().slice(0, 7), mrr: Math.round(mrr) })
  }

  ok(res, points)
})

/** Repartition du revenu recurrent par plan. */
app.get('/api/v1/admin/analytics/revenue-by-plan', requireAdminAuth, (_req, res) => {
  const totals = new Map()
  for (const record of subscriptions) {
    if (!['active', 'past_due'].includes(record.status)) continue
    const plan = resolvePlan(record.planId)
    if (!plan) continue
    const current = totals.get(plan.id) || { planId: plan.id, planName: plan.name, amount: 0, count: 0 }
    const monthlyEquivalent = plan.billingCycle === 'yearly' ? plan.price / 12 : plan.price
    current.amount += monthlyEquivalent
    current.count += 1
    totals.set(plan.id, current)
  }
  ok(
    res,
    Array.from(totals.values())
      .map((t) => ({ ...t, amount: Math.round(t.amount) }))
      .sort((a, b) => b.amount - a.amount)
  )
})

/** Taux de churn approximatif : part des abonnements actuellement resilies/expires sur l'ensemble des commerces inscrits. */
app.get('/api/v1/admin/analytics/churn', requireAdminAuth, (_req, res) => {
  const total = subscriptions.length
  const churned = subscriptions.filter((s) => ['canceled', 'expired'].includes(s.status)).length
  const churnRate = total > 0 ? Math.round((churned / total) * 1000) / 10 : 0
  ok(res, {
    totalBusinesses: total,
    churnedBusinesses: churned,
    churnRatePercent: churnRate,
    retentionRatePercent: Math.round((100 - churnRate) * 10) / 10
  })
})

/** Valeur vie client (LTV) moyenne : approximee par le chiffre d'affaires facture moyen observe par commerce. */
app.get('/api/v1/admin/analytics/ltv', requireAdminAuth, (_req, res) => {
  const revenues = businesses.map((b) => computeBusinessRevenueTotal(b.id)).filter((r) => r > 0)
  const average =
    revenues.length > 0 ? Math.round(revenues.reduce((sum, r) => sum + r, 0) / revenues.length) : 0
  ok(res, { averageLtv: average, sampleSize: revenues.length })
})

// --- Parametres globaux de la plateforme ----------------------------------

app.get('/api/v1/admin/settings', requireAdminAuth, (_req, res) => {
  ok(res, platformSettings)
})

app.patch('/api/v1/admin/settings', requireAdminAuth, requireSuperAdmin, (req, res) => {
  const payload = req.body || {}
  if (Array.isArray(payload.supportedCurrencies)) {
    platformSettings.supportedCurrencies = payload.supportedCurrencies
  }
  if (typeof payload.legalMentions === 'string') {
    platformSettings.legalMentions = payload.legalMentions
  }
  if (typeof payload.defaultTermsAndConditions === 'string') {
    platformSettings.defaultTermsAndConditions = payload.defaultTermsAndConditions
  }
  ok(res, platformSettings)
})

// --- Support : tickets commercant <-> admin --------------------------------

/** Cote commercant : ses propres tickets. */
app.get('/api/v1/support/tickets', requireAuth, (req, res) => {
  const businessTickets = supportTickets
    .filter((t) => t.businessId === req.currentBusiness.id)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  ok(res, businessTickets)
})

app.get('/api/v1/support/tickets/:id', requireAuth, (req, res) => {
  const ticket = supportTickets.find(
    (t) => t.id === req.params.id && t.businessId === req.currentBusiness.id
  )
  if (!ticket) {
    fail(res, 404, 'NOT_FOUND', 'Ticket introuvable.')
    return
  }
  ok(res, ticket)
})

app.post('/api/v1/support/tickets', requireAuth, (req, res) => {
  const payload = req.body || {}
  const subject = String(payload.subject || '').trim()
  const message = String(payload.message || '').trim()
  const errors = {}
  if (!subject) errors.subject = ['Le sujet est requis.']
  if (!message) errors.message = ['Le message est requis.']
  if (Object.keys(errors).length > 0) {
    res
      .status(422)
      .json({ success: false, code: 'VALIDATION_ERROR', message: 'Donnees invalides.', errors })
    return
  }

  const ticket = {
    id: crypto.randomUUID(),
    businessId: req.currentBusiness.id,
    businessName: req.currentBusiness.name,
    subject,
    status: 'open',
    messages: [
      {
        id: crypto.randomUUID(),
        author: 'business',
        authorName: `${req.currentUser.firstName} ${req.currentUser.lastName}`,
        body: message,
        createdAt: now()
      }
    ],
    createdAt: now(),
    updatedAt: now()
  }
  supportTickets.push(ticket)
  logPlatformEvent('ticket_created', `Nouveau ticket de ${req.currentBusiness.name} : ${subject}`)

  ok(res, ticket)
})

app.post('/api/v1/support/tickets/:id/messages', requireAuth, (req, res) => {
  const ticket = supportTickets.find(
    (t) => t.id === req.params.id && t.businessId === req.currentBusiness.id
  )
  if (!ticket) {
    fail(res, 404, 'NOT_FOUND', 'Ticket introuvable.')
    return
  }
  const body = String((req.body || {}).message || '').trim()
  if (!body) {
    res.status(422).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Donnees invalides.',
      errors: { message: ['Le message est requis.'] }
    })
    return
  }

  ticket.messages.push({
    id: crypto.randomUUID(),
    author: 'business',
    authorName: `${req.currentUser.firstName} ${req.currentUser.lastName}`,
    body,
    createdAt: now()
  })
  ticket.status = 'open'
  ticket.updatedAt = now()

  ok(res, ticket)
})

/** Cote admin : tous les tickets, tous commerces confondus. */
app.get('/api/v1/admin/support/tickets', requireAdminAuth, (req, res) => {
  const statusFilter = typeof req.query.status === 'string' ? req.query.status : ''
  let filtered = [...supportTickets]
  if (statusFilter) filtered = filtered.filter((t) => t.status === statusFilter)
  filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  respondPaginated(res, req, filtered, 'updatedAt')
})

app.get('/api/v1/admin/support/tickets/:id', requireAdminAuth, (req, res) => {
  const ticket = supportTickets.find((t) => t.id === req.params.id)
  if (!ticket) {
    fail(res, 404, 'NOT_FOUND', 'Ticket introuvable.')
    return
  }
  ok(res, ticket)
})

app.post('/api/v1/admin/support/tickets/:id/messages', requireAdminAuth, (req, res) => {
  const ticket = supportTickets.find((t) => t.id === req.params.id)
  if (!ticket) {
    fail(res, 404, 'NOT_FOUND', 'Ticket introuvable.')
    return
  }
  const body = String((req.body || {}).message || '').trim()
  if (!body) {
    res.status(422).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Donnees invalides.',
      errors: { message: ['Le message est requis.'] }
    })
    return
  }

  ticket.messages.push({
    id: crypto.randomUUID(),
    author: 'admin',
    authorName: `${req.currentAdmin.firstName} ${req.currentAdmin.lastName}`,
    body,
    createdAt: now()
  })
  ticket.updatedAt = now()

  ok(res, ticket)
})

app.patch('/api/v1/admin/support/tickets/:id/status', requireAdminAuth, (req, res) => {
  const ticket = supportTickets.find((t) => t.id === req.params.id)
  if (!ticket) {
    fail(res, 404, 'NOT_FOUND', 'Ticket introuvable.')
    return
  }
  const status = (req.body || {}).status
  if (!['open', 'closed'].includes(status)) {
    res.status(422).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Donnees invalides.',
      errors: { status: ['Statut invalide.'] }
    })
    return
  }
  ticket.status = status
  ticket.updatedAt = now()
  ok(res, ticket)
})

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

app.listen(PORT, () => {
  console.log(`Mock backend Facture IA sur http://localhost:${PORT}`)
  console.log("Compte de demo (avec donnees d'exemple): demo@facture-ia.com / password123")
})
