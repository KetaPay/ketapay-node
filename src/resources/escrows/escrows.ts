import type { APIPromise } from '../../core/api-promise.js'
import type { Query } from '../../core/http-client.js'
import type { RequestOptions } from '../../core/options.js'
import type { PagePromise } from '../../core/pagination.js'
import { Resource, seg } from '../../core/resource.js'
import { Milestones } from './milestones.js'
import type { Escrow, EscrowFlagParams, EscrowListParams, Flag } from './types.js'

export class Escrows extends Resource {
  readonly milestones = new Milestones(this.http)

  retrieve(id: string, options?: RequestOptions): APIPromise<Escrow> {
    return this.http.request('GET', `/escrows/${seg(id)}`, { options })
  }

  list(params?: EscrowListParams, options?: RequestOptions): PagePromise<Escrow> {
    return this.paginate('/escrows', params as Query | undefined, options)
  }

  /** Asks KetaPay to review an escrow. */
  flag(id: string, params: EscrowFlagParams, options?: RequestOptions): APIPromise<Flag> {
    return this.http.request('POST', `/escrows/${seg(id)}/flag`, { body: params, options })
  }
}
