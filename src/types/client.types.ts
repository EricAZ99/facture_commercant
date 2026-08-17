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
  createdAt: ISODateString
  updatedAt: ISODateString
}

/** Payload de creation d'un client. */
export type CreateClientPayload = Omit<Client, 'id' | 'businessId' | 'createdAt' | 'updatedAt'>

/** Payload de mise a jour partielle d'un client. */
export type UpdateClientPayload = Partial<CreateClientPayload>
