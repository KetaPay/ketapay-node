import type { operations } from '../../generated/openapi.js'
import type { Schemas } from '../common/types.js'

export type EventType = Schemas['EventType']
export type KetaPayEvent = Schemas['Event']
export type EventListParams = NonNullable<operations['listEvents']['parameters']['query']>

export type WebhookEndpoint = Schemas['WebhookEndpoint']
export type WebhookEndpointWithSecret = WebhookEndpoint & { secret: string }
export type WebhookEndpointCreateParams = Schemas['CreateWebhookEndpointRequest']
export type WebhookEndpointUpdateParams = Schemas['UpdateWebhookEndpointRequest']
export type WebhookEndpointListParams = NonNullable<operations['listWebhookEndpoints']['parameters']['query']>
export type WebhookTestResult = Schemas['WebhookTestResult']

export interface WebhookSecret {
  object: 'webhook_secret'
  secret: string
  previous_secret_expires_at: string
}

export interface VerifyOptions {
  /** Oldest signature to accept, in seconds. Defaults to 300 (5 minutes). */
  toleranceSeconds?: number
  /** Override the clock, for tests. Unix seconds. */
  now?: number
}
