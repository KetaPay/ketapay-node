import type { CustomerRequestOptions, Query, RequestOptions } from '../client.js'
import type { PagePromise } from '../pagination.js'
import type {
  BankTransferInstructions,
  CheckoutSession,
  CheckoutSessionCreateParams,
  CheckoutSessionListParams,
  CustomerSession,
  CustomerSessionCreateParams,
  CustomerToken,
} from '../types.js'
import { Resource, seg } from './base.js'

export class CheckoutSessions extends Resource {
  /** Starts checkout for one agreement. Call from your server only. */
  create(params: CheckoutSessionCreateParams, options?: RequestOptions): Promise<CheckoutSession> {
    return this.http.request('POST', '/checkout_sessions', { body: params, options })
  }

  retrieve(id: string, options?: RequestOptions): Promise<CheckoutSession> {
    return this.http.request('GET', `/checkout_sessions/${seg(id)}`, { options })
  }

  list(params?: CheckoutSessionListParams, options?: RequestOptions): PagePromise<CheckoutSession> {
    return this.paginate('/checkout_sessions', params as Query | undefined, options)
  }

  /** Closes an unpaid session. */
  cancel(id: string, options?: RequestOptions): Promise<CheckoutSession> {
    return this.http.request('POST', `/checkout_sessions/${seg(id)}/cancel`, { options })
  }

  /** Bank transfer details for your own payment screen. Needs the buyer's customer token. */
  bankTransfer(id: string, options: CustomerRequestOptions): Promise<BankTransferInstructions> {
    return this.http.request('POST', `/checkout_sessions/${seg(id)}/bank_transfer`, { options })
  }
}

export class CustomerSessions extends Resource {
  /** Sends a one-time code to the customer's email or phone. */
  create(params: CustomerSessionCreateParams, options?: RequestOptions): Promise<CustomerSession> {
    return this.http.request('POST', '/customer_sessions', { body: params, options })
  }

  /** Exchanges the code for a customer token valid for 15 minutes. Keep it on your server. */
  verify(id: string, code: string, options?: RequestOptions): Promise<CustomerToken> {
    return this.http.request('POST', `/customer_sessions/${seg(id)}/verify`, { body: { code }, options })
  }
}
