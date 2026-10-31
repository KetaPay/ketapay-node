import type { APIPromise } from '../../core/api-promise.js'
import type { CustomerRequestOptions, RequestOptions } from '../../core/options.js'
import { Resource, seg } from '../../core/resource.js'
import type { List } from '../common/types.js'
import type { Dispute, DisputeCreateParams, Evidence, EvidenceSubmitParams } from './types.js'

export class Disputes extends Resource {
  /** Opens a dispute for the buyer or the seller whose customer token you send. */
  create(escrowId: string, params: DisputeCreateParams, options: CustomerRequestOptions): APIPromise<Dispute> {
    return this.http.request('POST', `/escrows/${seg(escrowId)}/disputes`, { body: params, options })
  }

  retrieve(id: string, options?: RequestOptions): APIPromise<Dispute> {
    return this.http.request('GET', `/disputes/${seg(id)}`, { options })
  }

  /** Every dispute on an escrow, newest first. */
  listForEscrow(escrowId: string, options?: RequestOptions): APIPromise<List<Dispute>> {
    return this.http.request('GET', `/escrows/${seg(escrowId)}/disputes`, { options })
  }

  /** Settles against the customer whose token you send: the buyer releases, the seller refunds. */
  concede(id: string, options: CustomerRequestOptions): APIPromise<Dispute> {
    return this.http.request('POST', `/disputes/${seg(id)}/concede`, { options })
  }

  /** Hands an open dispute to KetaPay to decide, for the customer whose token you send. No money moves. */
  escalate(id: string, options: CustomerRequestOptions): APIPromise<Dispute> {
    return this.http.request('POST', `/disputes/${seg(id)}/escalate`, { options })
  }

  /** Withdraws a dispute. Only whoever opened it. */
  withdraw(id: string, options: CustomerRequestOptions): APIPromise<Dispute> {
    return this.http.request('POST', `/disputes/${seg(id)}/withdraw`, { options })
  }

  submitEvidence(id: string, params: EvidenceSubmitParams, options: CustomerRequestOptions): APIPromise<Evidence> {
    return this.http.request('POST', `/disputes/${seg(id)}/evidence`, { body: params, options })
  }

  listEvidence(id: string, options: CustomerRequestOptions): APIPromise<List<Evidence>> {
    return this.http.request('GET', `/disputes/${seg(id)}/evidence`, { options })
  }
}
