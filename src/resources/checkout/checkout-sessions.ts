import type { APIPromise } from '../../core/api-promise.js'
import type { Query } from '../../core/http-client.js'
import type { CustomerRequestOptions, RequestOptions } from '../../core/options.js'
import type { PagePromise } from '../../core/pagination.js'
import { Resource, seg } from '../../core/resource.js'
import type {
  BankTransferInstructions,
  CheckoutSession,
  CheckoutSessionCreateParams,
  CheckoutSessionListParams,
} from './types.js'

export class CheckoutSessions extends Resource {
  /** Starts checkout for one agreement. Call from your server only. */
  create(params: CheckoutSessionCreateParams, options?: RequestOptions): APIPromise<CheckoutSession> {
    return this.http.request('POST', '/checkout_sessions', { body: params, options })
  }

  retrieve(id: string, options?: RequestOptions): APIPromise<CheckoutSession> {
    return this.http.request('GET', `/checkout_sessions/${seg(id)}`, { options })
  }

  list(params?: CheckoutSessionListParams, options?: RequestOptions): PagePromise<CheckoutSession> {
    return this.paginate('/checkout_sessions', params as Query | undefined, options)
  }

  /** Closes an unpaid session. */
  cancel(id: string, options?: RequestOptions): APIPromise<CheckoutSession> {
    return this.http.request('POST', `/checkout_sessions/${seg(id)}/cancel`, { options })
  }

  /** Bank transfer details for your own payment screen. Needs the buyer's customer token. */
  bankTransfer(id: string, options: CustomerRequestOptions): APIPromise<BankTransferInstructions> {
    return this.http.request('POST', `/checkout_sessions/${seg(id)}/bank_transfer`, { options })
  }
}
