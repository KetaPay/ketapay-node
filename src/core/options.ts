import type { Logger, LogLevel } from './logger.js'

export interface KetaPayConfig {
  /** Your secret key, `sk_test_...` or `sk_live_...`. */
  apiKey: string
  /** Defaults to `https://api.ketapay.com/v1`. */
  baseUrl?: string
  /** Retries for network errors, 429 and 5xx. Defaults to 2. */
  maxRetries?: number
  /** Per-attempt timeout. Defaults to 30 seconds. */
  timeoutMs?: number
  /** Custom fetch, for tests, proxies or unusual runtimes. Defaults to the global fetch. */
  fetch?: typeof fetch
  /** Headers sent with every request, for example tracing ids. Cannot replace auth headers. */
  defaultHeaders?: Record<string, string>
  /** Defaults to `warn`. `debug` logs every request (never keys, tokens or bodies). */
  logLevel?: LogLevel
  /** Where logs go. Defaults to `console`. */
  logger?: Logger
  /**
   * For libraries built on this one: appended to the User-Agent (`my-plugin/1.2.0`) so KetaPay can tell
   * integrations apart. Letters, digits, dots and dashes only.
   */
  appInfo?: { name: string; version: string }
}

export interface RequestOptions {
  /** Sent as `Idempotency-Key` on POST. Generated for you when left out, and reused across retries. */
  idempotencyKey?: string
  /** Proof from your customer, from `customerSessions.verify()`. */
  customerToken?: string
  timeoutMs?: number
  maxRetries?: number
  /** Cancels the request (and any retries) when aborted. */
  signal?: AbortSignal
  /** Extra headers for this request only. */
  headers?: Record<string, string>
}

/** Options for calls the API only accepts with the customer's proof. */
export type CustomerRequestOptions = RequestOptions & { customerToken: string }
