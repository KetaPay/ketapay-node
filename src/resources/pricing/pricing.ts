import type { APIPromise } from '../../core/api-promise.js'
import type { RequestOptions } from '../../core/options.js'
import { Resource } from '../../core/resource.js'
import type { Pricing as PricingObject } from './types.js'

export class Pricing extends Resource {
  /** The rate your next escrow is priced on: the fee, VAT, who pays it and the escrow sizes it covers. */
  retrieve(options?: RequestOptions): APIPromise<PricingObject> {
    return this.http.request('GET', '/pricing', { options })
  }
}
