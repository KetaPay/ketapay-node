import type { Query, RequestOptions } from '../client.js'
import type { PagePromise } from '../pagination.js'
import type {
  CheckoutSession,
  Deleted,
  Escrow,
  EventListParams,
  EventType,
  KetaPayEvent,
  SimulateParams,
  TestPayParams,
  WebhookEndpoint,
  WebhookEndpointCreateParams,
  WebhookEndpointListParams,
  WebhookEndpointUpdateParams,
  WebhookEndpointWithSecret,
  WebhookSecret,
  WebhookTestResult,
} from '../types.js'
import { Resource, seg } from './base.js'

export class WebhookEndpoints extends Resource {
  /** The response is the only time `secret` is shown. Store it. */
  create(params: WebhookEndpointCreateParams, options?: RequestOptions): Promise<WebhookEndpointWithSecret> {
    return this.http.request('POST', '/webhook_endpoints', { body: params, options })
  }

  retrieve(id: string, options?: RequestOptions): Promise<WebhookEndpoint> {
    return this.http.request('GET', `/webhook_endpoints/${seg(id)}`, { options })
  }

  update(id: string, params: WebhookEndpointUpdateParams, options?: RequestOptions): Promise<WebhookEndpoint> {
    return this.http.request('POST', `/webhook_endpoints/${seg(id)}`, { body: params, options })
  }

  list(params?: WebhookEndpointListParams, options?: RequestOptions): PagePromise<WebhookEndpoint> {
    return this.paginate('/webhook_endpoints', params as Query | undefined, options)
  }

  del(id: string, options?: RequestOptions): Promise<Deleted> {
    return this.http.request('DELETE', `/webhook_endpoints/${seg(id)}`, { options })
  }

  /** Sends a signed sample event now and reports what your server answered. */
  test(id: string, type: EventType, options?: RequestOptions): Promise<WebhookTestResult> {
    return this.http.request('POST', `/webhook_endpoints/${seg(id)}/test`, { body: { type }, options })
  }

  /** New signing secret; the old one keeps signing alongside it for 24 hours. */
  rotateSecret(id: string, options?: RequestOptions): Promise<WebhookSecret> {
    return this.http.request('POST', `/webhook_endpoints/${seg(id)}/rotate_secret`, { options })
  }
}

export class Events extends Resource {
  retrieve(id: string, options?: RequestOptions): Promise<KetaPayEvent> {
    return this.http.request('GET', `/events/${seg(id)}`, { options })
  }

  list(params?: EventListParams, options?: RequestOptions): PagePromise<KetaPayEvent> {
    return this.paginate('/events', params as Query | undefined, options)
  }
}

/** Sandbox only (`sk_test_` keys). */
export class TestHelpers extends Resource {
  readonly checkoutSessions = {
    /** Pays the session as if the buyer did. */
    pay: (id: string, params?: TestPayParams, options?: RequestOptions): Promise<CheckoutSession> =>
      this.http.request('POST', `/test_helpers/checkout_sessions/${seg(id)}/pay`, { body: params ?? {}, options }),
  }

  readonly escrows = {
    /** Does what a buyer, seller, bank or KetaPay would do, with the same rules and webhooks. */
    simulate: (id: string, params: SimulateParams, options?: RequestOptions): Promise<Escrow> =>
      this.http.request('POST', `/test_helpers/escrows/${seg(id)}/simulate`, { body: params, options }),
  }
}
