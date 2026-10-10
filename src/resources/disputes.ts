import type { CustomerRequestOptions, RequestOptions } from '../client.js'
import type { Chargeback, Dispute, DisputeCreateParams, Evidence, EvidenceSubmitParams, List } from '../types.js'
import { Resource, seg } from './base.js'

export class Disputes extends Resource {
  /** Opens a dispute for the buyer or the seller whose customer token you send. */
  create(escrowId: string, params: DisputeCreateParams, options: CustomerRequestOptions): Promise<Dispute> {
    return this.http.request('POST', `/escrows/${seg(escrowId)}/disputes`, { body: params, options })
  }

  retrieve(id: string, options?: RequestOptions): Promise<Dispute> {
    return this.http.request('GET', `/disputes/${seg(id)}`, { options })
  }

  /** Every dispute on an escrow, newest first. */
  listForEscrow(escrowId: string, options?: RequestOptions): Promise<List<Dispute>> {
    return this.http.request('GET', `/escrows/${seg(escrowId)}/disputes`, { options })
  }

  /** Settles against the customer whose token you send: the buyer releases, the seller refunds. */
  concede(id: string, options: CustomerRequestOptions): Promise<Dispute> {
    return this.http.request('POST', `/disputes/${seg(id)}/concede`, { options })
  }

  /** Withdraws a dispute. Only whoever opened it. */
  withdraw(id: string, options: CustomerRequestOptions): Promise<Dispute> {
    return this.http.request('POST', `/disputes/${seg(id)}/withdraw`, { options })
  }

  submitEvidence(id: string, params: EvidenceSubmitParams, options: CustomerRequestOptions): Promise<Evidence> {
    return this.http.request('POST', `/disputes/${seg(id)}/evidence`, { body: params, options })
  }

  listEvidence(id: string, options: CustomerRequestOptions): Promise<List<Evidence>> {
    return this.http.request('GET', `/disputes/${seg(id)}/evidence`, { options })
  }
}

export class Chargebacks extends Resource {
  retrieve(id: string, options?: RequestOptions): Promise<Chargeback> {
    return this.http.request('GET', `/chargebacks/${seg(id)}`, { options })
  }

  listForEscrow(escrowId: string, options?: RequestOptions): Promise<List<Chargeback>> {
    return this.http.request('GET', `/escrows/${seg(escrowId)}/chargebacks`, { options })
  }

  /** The seller adds proof of delivery. Needs the seller's customer token. */
  submitEvidence(id: string, params: EvidenceSubmitParams, options: CustomerRequestOptions): Promise<Evidence> {
    return this.http.request('POST', `/chargebacks/${seg(id)}/evidence`, { body: params, options })
  }
}
