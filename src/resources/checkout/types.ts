import type { operations } from '../../generated/openapi.js'
import type { AttachmentInput, ImageInput, PartyInput, Schemas } from '../common/types.js'

export type CheckoutSession = Schemas['CheckoutSession']
export type CheckoutSessionStatus = Schemas['CheckoutSessionStatus']
export type Fees = Schemas['Fees']
export type Release = Schemas['Release']
export type MilestoneInput = Schemas['MilestoneInput']
export type CommissionInput = Schemas['CommissionInput']
export type BankTransferInstructions = Schemas['BankTransferInstructions']

export type CheckoutSessionCreateParams = Omit<
  Schemas['CreateCheckoutSessionRequest'],
  'buyer' | 'seller' | 'images' | 'attachments'
> & {
  buyer: PartyInput
  /** Leave out when you sell your own goods: your business is the seller and is paid on release. */
  seller?: PartyInput
  images?: ImageInput[]
  attachments?: AttachmentInput[]
}

export type CheckoutSessionListParams = NonNullable<operations['listCheckoutSessions']['parameters']['query']>
