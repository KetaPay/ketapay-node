import { HttpClient } from './core/http-client.js'
import type { KetaPayConfig, KetaPayOptions } from './core/options.js'
import { CheckoutSessions } from './resources/checkout/index.js'
import { CustomerSessions } from './resources/customers/index.js'
import { Chargebacks, Disputes } from './resources/disputes/index.js'
import { MoneyActions } from './resources/money-actions/index.js'
import { Escrows } from './resources/escrows/index.js'
import { Files } from './resources/files/index.js'
import { Banks, PayoutAccounts } from './resources/payouts/index.js'
import { TestHelpers } from './resources/test-helpers/index.js'
import { Events, generateTestSignatureHeader, verifyWebhook, WebhookEndpoints } from './resources/webhooks/index.js'

export class KetaPay {
  // Checkout
  readonly checkoutSessions: CheckoutSessions
  // Customers
  readonly customerSessions: CustomerSessions
  // Escrows
  readonly escrows: Escrows
  // Disputes
  readonly disputes: Disputes
  // What your business decided that moved money
  readonly moneyActions: MoneyActions
  readonly chargebacks: Chargebacks
  // Payouts
  readonly payoutAccounts: PayoutAccounts
  readonly banks: Banks
  // Files
  readonly files: Files
  // Webhooks
  readonly webhookEndpoints: WebhookEndpoints
  readonly events: Events
  /** Signature verification for incoming webhooks. Needs no API key. */
  readonly webhooks = { verify: verifyWebhook, generateTestSignatureHeader }
  /** Sandbox only. */
  readonly testHelpers: TestHelpers
  /** True for `sk_live_` keys. */
  readonly livemode: boolean

  /**
   * `new KetaPay(key, options)` or `new KetaPay({ apiKey, ...options })`. Options are never dropped:
   * a key given in both places, or options after a config object, is refused.
   */
  constructor(apiKey: string, options?: KetaPayOptions)
  constructor(config: KetaPayConfig)
  constructor(apiKeyOrConfig: string | KetaPayConfig, options?: KetaPayOptions) {
    const config = resolveConfig(apiKeyOrConfig, options)
    const http = new HttpClient(config)
    this.livemode = http.livemode
    this.checkoutSessions = new CheckoutSessions(http)
    this.customerSessions = new CustomerSessions(http)
    this.escrows = new Escrows(http)
    this.disputes = new Disputes(http)
    this.moneyActions = new MoneyActions(http)
    this.chargebacks = new Chargebacks(http)
    this.payoutAccounts = new PayoutAccounts(http)
    this.banks = new Banks(http)
    this.files = new Files(http)
    this.webhookEndpoints = new WebhookEndpoints(http)
    this.events = new Events(http)
    this.testHelpers = new TestHelpers(http)
  }
}

function resolveConfig(apiKeyOrConfig: string | KetaPayConfig, options: KetaPayOptions | undefined): KetaPayConfig {
  if (typeof apiKeyOrConfig !== 'string') {
    if (options !== undefined) {
      throw new TypeError('KetaPay: pass options inside the config object, or use new KetaPay(key, options)')
    }
    return apiKeyOrConfig
  }
  if (options && 'apiKey' in options) {
    throw new TypeError('KetaPay: the key is given twice; pass it as the first argument only')
  }
  return { ...options, apiKey: apiKeyOrConfig }
}
