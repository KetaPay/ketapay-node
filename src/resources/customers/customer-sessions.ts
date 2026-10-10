import type { APIPromise } from '../../core/api-promise.js'
import type { RequestOptions } from '../../core/options.js'
import { Resource, seg } from '../../core/resource.js'
import type { CustomerSession, CustomerSessionCreateParams, CustomerToken } from './types.js'

export class CustomerSessions extends Resource {
  /** Sends a one-time code to the customer's email or phone. */
  create(params: CustomerSessionCreateParams, options?: RequestOptions): APIPromise<CustomerSession> {
    return this.http.request('POST', '/customer_sessions', { body: params, options })
  }

  /** Exchanges the code for a customer token valid for 15 minutes. Keep it on your server. */
  verify(id: string, code: string, options?: RequestOptions): APIPromise<CustomerToken> {
    return this.http.request('POST', `/customer_sessions/${seg(id)}/verify`, { body: { code }, options })
  }
}
