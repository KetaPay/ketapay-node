import type { CustomerRequestOptions, Query, RequestOptions } from '../client.js'
import type { PagePromise } from '../pagination.js'
import type {
  Escrow,
  EscrowCancelParams,
  EscrowFlagParams,
  EscrowListParams,
  Flag,
  MilestoneDeliverParams,
  MilestoneReleaseParams,
  ReleaseCode,
} from '../types.js'
import { Resource, seg } from './base.js'

export class Milestones extends Resource {
  /** The seller marks the milestone delivered. Needs the seller's customer token. */
  deliver(
    escrowId: string,
    milestoneId: string,
    params: MilestoneDeliverParams,
    options: CustomerRequestOptions,
  ): Promise<Escrow> {
    return this.http.request('POST', `/escrows/${seg(escrowId)}/milestones/${seg(milestoneId)}/deliver`, {
      body: params,
      options,
    })
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
  ): Promise<Escrow> {
    return this.http.request('POST', `/escrows/${seg(escrowId)}/milestones/${seg(milestoneId)}/release`, {
      body: params ?? {},
      options,
    })
  }

  /** The buyer's release code, for the buyer's screen only. Needs the buyer's customer token. */
  releaseCode(escrowId: string, milestoneId: string, options: CustomerRequestOptions): Promise<ReleaseCode> {
    return this.http.request('GET', `/escrows/${seg(escrowId)}/milestones/${seg(milestoneId)}/release_code`, {
      options,
    })
  }
}

export class Escrows extends Resource {
  readonly milestones = new Milestones(this.http)

  retrieve(id: string, options?: RequestOptions): Promise<Escrow> {
    return this.http.request('GET', `/escrows/${seg(id)}`, { options })
  }

  list(params?: EscrowListParams, options?: RequestOptions): PagePromise<Escrow> {
    return this.paginate('/escrows', params as Query | undefined, options)
  }

  /** Refunds the buyer every unreleased milestone. Needs the buyer's or seller's customer token. */
  cancel(id: string, params: EscrowCancelParams | undefined, options: CustomerRequestOptions): Promise<Escrow> {
    return this.http.request('POST', `/escrows/${seg(id)}/cancel`, { body: params ?? {}, options })
  }

  /** Asks KetaPay to review an escrow. */
  flag(id: string, params: EscrowFlagParams, options?: RequestOptions): Promise<Flag> {
    return this.http.request('POST', `/escrows/${seg(id)}/flag`, { body: params, options })
  }
}
