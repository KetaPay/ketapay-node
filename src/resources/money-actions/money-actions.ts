import type { APIPromise } from '../../core/api-promise.js'
import type { RequestOptions } from '../../core/options.js'
import { Resource, seg } from '../../core/resource.js'
import type { MoneyAction } from './types.js'

export class MoneyActions extends Resource {
  retrieve(id: string, options?: RequestOptions): APIPromise<MoneyAction> {
    return this.http.request('GET', `/money_actions/${seg(id)}`, { options })
  }
}
