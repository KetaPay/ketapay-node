import type { APIPromise } from '../../core/api-promise.js'
import type { Query } from '../../core/http-client.js'
import type { RequestOptions } from '../../core/options.js'
import type { PagePromise } from '../../core/pagination.js'
import { Resource, seg } from '../../core/resource.js'
import type { EventListParams, KetaPayEvent } from './types.js'

/** The last 30 days of events, for catching up on anything your endpoint missed. */
export class Events extends Resource {
  retrieve(id: string, options?: RequestOptions): APIPromise<KetaPayEvent> {
    return this.http.request('GET', `/events/${seg(id)}`, { options })
  }

  list(params?: EventListParams, options?: RequestOptions): PagePromise<KetaPayEvent> {
    return this.paginate('/events', params as Query | undefined, options)
  }
}
