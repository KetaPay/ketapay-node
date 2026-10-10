import type { APIPromise } from '../../core/api-promise.js'
import type { CustomerRequestOptions } from '../../core/options.js'
import { Resource, seg } from '../../core/resource.js'
import type { Deleted, List } from '../common/types.js'
import type { PayoutAccount, PayoutAccountCreateParams } from './types.js'

/** A customer's bank accounts. Every call needs that customer's token. */
export class PayoutAccounts extends Resource {
  /** Starts adding a bank account; KetaPay sends the customer a code naming it. */
  create(params: PayoutAccountCreateParams, options: CustomerRequestOptions): APIPromise<PayoutAccount> {
    return this.http.request('POST', '/payout_accounts', { body: params, options })
  }

  /** Activates the account with the code the customer received. */
  confirm(id: string, code: string, options: CustomerRequestOptions): APIPromise<PayoutAccount> {
    return this.http.request('POST', `/payout_accounts/${seg(id)}/confirm`, { body: { code }, options })
  }

  list(options: CustomerRequestOptions): APIPromise<List<PayoutAccount>> {
    return this.http.request('GET', '/payout_accounts', { options })
  }

  del(id: string, options: CustomerRequestOptions): APIPromise<Deleted> {
    return this.http.request('DELETE', `/payout_accounts/${seg(id)}`, { options })
  }
}
