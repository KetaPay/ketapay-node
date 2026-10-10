import type { APIPromise } from '../../core/api-promise.js'
import type { Query } from '../../core/http-client.js'
import type { CustomerRequestOptions, RequestOptions } from '../../core/options.js'
import type { PagePromise } from '../../core/pagination.js'
import { Resource, seg } from '../../core/resource.js'
import { Milestones } from './milestones.js'
import type { Escrow, EscrowCancelParams, EscrowFlagParams, EscrowListParams, Flag } from './types.js'

export class Escrows extends Resource {
  readonly milestones = new Milestones(this.http)

  retrieve(id: string, options?: RequestOptions): APIPromise<Escrow> {
    return this.http.request('GET', `/escrows/${seg(id)}`, { options })
  }

  list(params?: EscrowListParams, options?: RequestOptions): PagePromise<Escrow> {
    return this.paginate('/escrows', params as Query | undefined, options)
  }

  /** Refunds the buyer every unreleased milestone. Needs the buyer's or seller's customer token. */
  cancel(id: string, params: EscrowCancelParams | undefined, options: CustomerRequestOptions): APIPromise<Escrow> {
    return this.http.request('POST', `/escrows/${seg(id)}/cancel`, { body: params ?? {}, options })
  }

  /** Asks KetaPay to review an escrow. */
  flag(id: string, params: EscrowFlagParams, options?: RequestOptions): APIPromise<Flag> {
    return this.http.request('POST', `/escrows/${seg(id)}/flag`, { body: params, options })
  }
}
