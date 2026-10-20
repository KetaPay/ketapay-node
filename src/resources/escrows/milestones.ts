import type { APIPromise } from '../../core/api-promise.js'
import type { CustomerRequestOptions, RequestOptions } from '../../core/options.js'
import { Resource, seg } from '../../core/resource.js'
import type { Escrow, MilestoneDeliverParams, MilestoneReleaseParams, ReleaseCode } from './types.js'

const path = (escrowId: string, milestoneId: string) => `/escrows/${seg(escrowId)}/milestones/${seg(milestoneId)}`

export class Milestones extends Resource {
  /**
   * The seller marks the milestone delivered. Needs the seller's customer token, except on your
   * own sale (the escrow's `seller` is your business), where your key alone delivers it.
   */
  deliver(
    escrowId: string,
    milestoneId: string,
    params: MilestoneDeliverParams,
    options?: RequestOptions,
  ): APIPromise<Escrow> {
    return this.http.request('POST', `${path(escrowId, milestoneId)}/deliver`, { body: params, options })
  }

  /**
   * Pays the seller for this milestone. Send the buyer's customer token, or (for `release_code`
   * escrows) the buyer's `release_code` in `params`.
   */
  release(
    escrowId: string,
    milestoneId: string,
    params?: MilestoneReleaseParams,
    options?: RequestOptions,
  ): APIPromise<Escrow> {
    return this.http.request('POST', `${path(escrowId, milestoneId)}/release`, { body: params ?? {}, options })
  }

  /** The buyer's release code, for the buyer's screen only. Needs the buyer's customer token. */
  releaseCode(escrowId: string, milestoneId: string, options: CustomerRequestOptions): APIPromise<ReleaseCode> {
    return this.http.request('GET', `${path(escrowId, milestoneId)}/release_code`, { options })
  }
}
