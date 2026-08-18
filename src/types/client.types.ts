import type { ID, ISODateString } from './common.types'

/** Client d'un commerce (personne facturee). */
export interface Client {
  id: ID
  businessId: ID
  firstName: string
  lastName: string
  phone?: string
  email?: string
  address?: string
  city?: string
  country?: string
  /** Identifiant fiscal (optionnel). */
  taxId?: string
  /** Note libre a l'usage du commerce (jamais visible du client). */
  notes?: string
  /** Etiquettes libres (segmentation : "VIP", "Grossiste"...). */
  tags?: string[]
  /**
   * Solde du restant sur l'ensemble des factures du client (present
   * uniquement sur la fiche detail, jamais dans la liste paginee — evite un
   * calcul couteux sur chaque ligne d'une liste).
   */
  outstandingBalance?: number
  createdAt: ISODateString
  updatedAt: ISODateString
}

/** Payload de creation d'un client. */
export type CreateClientPayload = Omit<
  Client,
  'id' | 'businessId' | 'createdAt' | 'updatedAt' | 'outstandingBalance'
>

/** Payload de mise a jour partielle d'un client. */
export type UpdateClientPayload = Partial<CreateClientPayload>

/** Resultat d'un import en masse de clients (CSV). */
export interface ClientImportResult {
  createdCount: number
  errors: Array<{ row: number; message: string }>
}

/**
 * Fusion de deux fiches en doublon : toutes les factures/paiements de
 * `duplicateId` sont reattribues a `primaryId`, puis `duplicateId` est
 * supprime. Aucune fusion champ par champ : `primaryId` designe la fiche
 * dont les informations (nom, email...) sont conservees telles quelles.
 */
export interface MergeClientsPayload {
  primaryId: ID
  duplicateId: ID
}
