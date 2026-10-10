import type { CustomerRequestOptions, RequestOptions } from '../client.js'
import type {
  Bank,
  Deleted,
  FileCreateParams,
  KetaPayFile,
  List,
  PayoutAccount,
  PayoutAccountCreateParams,
} from '../types.js'
import { Resource, seg } from './base.js'

export class Banks extends Resource {
  list(options?: RequestOptions): Promise<List<Bank>> {
    return this.http.request('GET', '/banks', { options })
  }
}

export class PayoutAccounts extends Resource {
  /** Starts adding a bank account; KetaPay sends the customer a code naming it. */
  create(params: PayoutAccountCreateParams, options: CustomerRequestOptions): Promise<PayoutAccount> {
    return this.http.request('POST', '/payout_accounts', { body: params, options })
  }

  /** Activates the account with the code the customer received. */
  confirm(id: string, code: string, options: CustomerRequestOptions): Promise<PayoutAccount> {
    return this.http.request('POST', `/payout_accounts/${seg(id)}/confirm`, { body: { code }, options })
  }

  list(options: CustomerRequestOptions): Promise<List<PayoutAccount>> {
    return this.http.request('GET', '/payout_accounts', { options })
  }

  del(id: string, options: CustomerRequestOptions): Promise<Deleted> {
    return this.http.request('DELETE', `/payout_accounts/${seg(id)}`, { options })
  }
}

export class Files extends Resource {
  /**
   * Uploads a file for checkout attachments (`agreement`, your key alone), milestone deliveries
   * (`delivery`, seller's token) or dispute evidence (`dispute_evidence`, buyer's or seller's token).
   */
  create(params: FileCreateParams, options?: RequestOptions): Promise<KetaPayFile> {
    const blob =
      params.file instanceof Blob
        ? params.file
        : new Blob([params.file], { type: params.contentType ?? 'application/octet-stream' })
    const form = new FormData()
    form.append('file', blob, params.filename)
    form.append('purpose', params.purpose)
    return this.http.request('POST', '/files', { form, options })
  }
}
