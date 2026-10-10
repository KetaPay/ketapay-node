import type { APIPromise } from '../../core/api-promise.js'
import type { Query } from '../../core/http-client.js'
import type { RequestOptions } from '../../core/options.js'
import type { PagePromise } from '../../core/pagination.js'
import { Resource, seg } from '../../core/resource.js'
import type { Deleted } from '../common/types.js'
import type {
  EventType,
  WebhookEndpoint,
  WebhookEndpointCreateParams,
  WebhookEndpointListParams,
  WebhookEndpointUpdateParams,
  WebhookEndpointWithSecret,
  WebhookSecret,
  WebhookTestResult,
} from './types.js'

export class WebhookEndpoints extends Resource {
  /** The response is the only time `secret` is shown. Store it. */
  create(params: WebhookEndpointCreateParams, options?: RequestOptions): APIPromise<WebhookEndpointWithSecret> {
    return this.http.request('POST', '/webhook_endpoints', { body: params, options })
  }

  retrieve(id: string, options?: RequestOptions): APIPromise<WebhookEndpoint> {
    return this.http.request('GET', `/webhook_endpoints/${seg(id)}`, { options })
  }

  /** Change the URL or events, or re-enable a `failing` endpoint with `{ status: 'enabled' }`. */
  update(id: string, params: WebhookEndpointUpdateParams, options?: RequestOptions): APIPromise<WebhookEndpoint> {
    return this.http.request('POST', `/webhook_endpoints/${seg(id)}`, { body: params, options })
  }

  list(params?: WebhookEndpointListParams, options?: RequestOptions): PagePromise<WebhookEndpoint> {
    return this.paginate('/webhook_endpoints', params as Query | undefined, options)
  }

  del(id: string, options?: RequestOptions): APIPromise<Deleted> {
    return this.http.request('DELETE', `/webhook_endpoints/${seg(id)}`, { options })
  }

  /** Sends a signed sample event now and reports what your server answered. */
  test(id: string, type: EventType, options?: RequestOptions): APIPromise<WebhookTestResult> {
    return this.http.request('POST', `/webhook_endpoints/${seg(id)}/test`, { body: { type }, options })
  }

  /** New signing secret; the old one keeps signing alongside it for 24 hours. */
  rotateSecret(id: string, options?: RequestOptions): APIPromise<WebhookSecret> {
    return this.http.request('POST', `/webhook_endpoints/${seg(id)}/rotate_secret`, { options })
  }
}
