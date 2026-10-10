import { HttpClient, type KetaPayConfig } from './client.js'
import { CheckoutSessions, CustomerSessions } from './resources/checkout-sessions.js'
import { Chargebacks, Disputes } from './resources/disputes.js'
import { Escrows } from './resources/escrows.js'
import { Banks, Files, PayoutAccounts } from './resources/payouts.js'
import { Events, TestHelpers, WebhookEndpoints } from './resources/webhook-endpoints.js'
import { generateTestSignatureHeader, verifyWebhook } from './webhooks.js'

export class KetaPay {
  readonly checkoutSessions: CheckoutSessions
  readonly customerSessions: CustomerSessions
  readonly escrows: Escrows
  readonly disputes: Disputes
  readonly chargebacks: Chargebacks
  readonly files: Files
  readonly banks: Banks
  readonly payoutAccounts: PayoutAccounts
  readonly webhookEndpoints: WebhookEndpoints
  readonly events: Events
  /** Sandbox only. */
  readonly testHelpers: TestHelpers
  /** Signature verification for incoming webhooks. Needs no API key. */
  readonly webhooks = { verify: verifyWebhook, generateTestSignatureHeader }
  /** True for `sk_live_` keys. */
  readonly livemode: boolean

  constructor(apiKeyOrConfig: string | KetaPayConfig) {
    const config = typeof apiKeyOrConfig === 'string' ? { apiKey: apiKeyOrConfig } : apiKeyOrConfig
    const http = new HttpClient(config)
    this.livemode = http.livemode
    this.checkoutSessions = new CheckoutSessions(http)
    this.customerSessions = new CustomerSessions(http)
    this.escrows = new Escrows(http)
    this.disputes = new Disputes(http)
    this.chargebacks = new Chargebacks(http)
    this.files = new Files(http)
    this.banks = new Banks(http)
    this.payoutAccounts = new PayoutAccounts(http)
    this.webhookEndpoints = new WebhookEndpoints(http)
    this.events = new Events(http)
    this.testHelpers = new TestHelpers(http)
  }
}

export default KetaPay
export type { KetaPayConfig, RequestOptions, CustomerRequestOptions } from './client.js'
export * from './errors.js'
export { PagePromise, type Page } from './pagination.js'
export { verifyWebhook, generateTestSignatureHeader, type VerifyOptions } from './webhooks.js'
export type * from './types.js'
export { VERSION } from './version.js'
