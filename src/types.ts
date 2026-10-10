// Public types. Everything here comes from the generated spec types except the few "one of these
// fields" inputs, which the generator can only express loosely and are written out exactly below.
import type { components, operations } from './generated/openapi.js'

type Schemas = components['schemas']
type QueryOf<K extends keyof operations> = NonNullable<operations[K]['parameters']['query']>

// ── Shared ──────────────────────────────────────────────────────────────────
export type Amount = Schemas['Amount']
export type Metadata = Schemas['Metadata']
export type Category = Schemas['Category']
export type Release = Schemas['Release']
export type Fees = Schemas['Fees']
export type Deleted = Schemas['Deleted']
export type ApiErrorBody = Schemas['Error']

type FileOrUrl = { file: string; url?: string } | { url: string; file?: string }
/** An image: an id from `files.create()` or an HTTPS link. */
export type ImageInput = FileOrUrl & { alt?: string | null }
/** A document: an id from `files.create()` or an HTTPS link. */
export type AttachmentInput = FileOrUrl & { name?: string }
export type Image = Schemas['Image']
export type Attachment = Schemas['Attachment']

/** A buyer or seller: at least one of `email` and `phone`, both if you have them. */
export type PartyInput =
  | { email: string; phone?: string; name?: string | null }
  | { phone: string; email?: string; name?: string | null }
export type Party = Schemas['Party']

// ── Checkout sessions ───────────────────────────────────────────────────────
export type CheckoutSession = Schemas['CheckoutSession']
export type CheckoutSessionStatus = Schemas['CheckoutSessionStatus']
export type MilestoneInput = Schemas['MilestoneInput']
export type CommissionInput = Schemas['CommissionInput']
export type CheckoutSessionCreateParams = Omit<
  Schemas['CreateCheckoutSessionRequest'],
  'buyer' | 'seller' | 'images' | 'attachments'
> & {
  buyer: PartyInput
  seller: PartyInput
  images?: ImageInput[]
  attachments?: AttachmentInput[]
}
export type CheckoutSessionListParams = QueryOf<'listCheckoutSessions'>
export type BankTransferInstructions = Schemas['BankTransferInstructions']

// ── Customer sessions ───────────────────────────────────────────────────────
/** Exactly one of `email` and `phone`: the one-time code goes there. */
export type CustomerSessionCreateParams = { email: string; phone?: never } | { phone: string; email?: never }
export type CustomerSession = Schemas['CustomerSession']
export type CustomerToken = Schemas['CustomerToken']

// ── Escrows and milestones ──────────────────────────────────────────────────
export type Escrow = Schemas['Escrow']
export type EscrowStatus = Schemas['EscrowStatus']
export type Milestone = Schemas['Milestone']
export type MilestoneStatus = Schemas['MilestoneStatus']
export type Delivery = Schemas['Delivery']
export type TimelineEntry = Schemas['TimelineEntry']
export type EscrowListParams = QueryOf<'listEscrows'>
export type MilestoneDeliverParams = Omit<Schemas['DeliverMilestoneRequest'], 'attachments'> & {
  attachments?: AttachmentInput[]
}
export type MilestoneReleaseParams = Schemas['ReleaseMilestoneRequest']
export type ReleaseCode = Schemas['ReleaseCode']
export type EscrowCancelParams = Schemas['CancelEscrowRequest']
export type EscrowFlagParams = Schemas['CreateFlagRequest']
export type Flag = Schemas['Flag']

// ── Disputes, refunds, chargebacks ──────────────────────────────────────────
export type Dispute = Schemas['Dispute']
export type DisputeReason = Schemas['DisputeReason']
export type DisputeCreateParams = Schemas['CreateDisputeRequest']
export type EvidenceSubmitParams = Schemas['SubmitEvidenceRequest']
export type Evidence = Schemas['Evidence']
export type Refund = Schemas['Refund']
export type Payout = Schemas['Payout']
export type Chargeback = Schemas['Chargeback']

// ── Files ───────────────────────────────────────────────────────────────────
export type FilePurpose = Schemas['FilePurpose']
export type KetaPayFile = Schemas['File']
export interface FileCreateParams {
  /** The file contents. */
  file: Blob | Uint8Array
  /** Shown to the buyer, seller and KetaPay. */
  filename: string
  purpose: FilePurpose
  /** Defaults to `application/octet-stream`; KetaPay detects the real type. */
  contentType?: string
}

// ── Payout accounts and banks ───────────────────────────────────────────────
export type Bank = Schemas['Bank']
export type PayoutAccount = Schemas['PayoutAccount']
export type PayoutAccountCreateParams = Schemas['CreatePayoutAccountRequest']

// ── Webhooks and events ─────────────────────────────────────────────────────
export type EventType = Schemas['EventType']
export type KetaPayEvent = Schemas['Event']
export type EventListParams = QueryOf<'listEvents'>
export type WebhookEndpoint = Schemas['WebhookEndpoint']
export type WebhookEndpointWithSecret = WebhookEndpoint & { secret: string }
export type WebhookEndpointCreateParams = Schemas['CreateWebhookEndpointRequest']
export type WebhookEndpointUpdateParams = Schemas['UpdateWebhookEndpointRequest']
export type WebhookEndpointListParams = QueryOf<'listWebhookEndpoints'>
export type WebhookTestResult = Schemas['WebhookTestResult']
export interface WebhookSecret {
  object: 'webhook_secret'
  secret: string
  previous_secret_expires_at: string
}

// ── Test helpers ────────────────────────────────────────────────────────────
export type SimulateParams = Schemas['SimulateRequest']
export interface TestPayParams {
  method?: 'card' | 'bank_transfer'
}

export interface List<T> {
  object: 'list'
  data: T[]
}
