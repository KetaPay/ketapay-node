import type { APIPromise } from '../../core/api-promise.js'
import type { RequestOptions } from '../../core/options.js'
import { Resource } from '../../core/resource.js'
import type { List } from '../common/types.js'
import type { Bank } from './types.js'

export class Banks extends Resource {
  /** Every bank a payout can go to, for your payout account form. */
  list(options?: RequestOptions): APIPromise<List<Bank>> {
    return this.http.request('GET', '/banks', { options })
  }
}
