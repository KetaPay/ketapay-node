import type { APIPromise } from '../../core/api-promise.js'
import type { CustomerRequestOptions, RequestOptions } from '../../core/options.js'
import { Resource, seg } from '../../core/resource.js'
import type { List } from '../common/types.js'
import type { Chargeback, Evidence, EvidenceSubmitParams } from './types.js'

export class Chargebacks extends Resource {
  retrieve(id: string, options?: RequestOptions): APIPromise<Chargeback> {
    return this.http.request('GET', `/chargebacks/${seg(id)}`, { options })
  }

  listForEscrow(escrowId: string, options?: RequestOptions): APIPromise<List<Chargeback>> {
    return this.http.request('GET', `/escrows/${seg(escrowId)}/chargebacks`, { options })
  }

  /** The seller adds proof of delivery. Needs the seller's customer token. */
  submitEvidence(id: string, params: EvidenceSubmitParams, options: CustomerRequestOptions): APIPromise<Evidence> {
    return this.http.request('POST', `/chargebacks/${seg(id)}/evidence`, { body: params, options })
  }
}
