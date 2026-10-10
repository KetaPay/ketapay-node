export type ErrorType =
  | 'invalid_request_error'
  | 'authentication_error'
  | 'permission_error'
  | 'idempotency_error'
  | 'rate_limit_error'
  | 'api_error'

interface ErrorBody {
  type?: ErrorType
  code?: string
  message?: string
  param?: string | null
  request_id?: string
}

/** Base class for every error this library throws. Branch on `code`, never on `message`. */
export class KetaPayError extends Error {
  readonly type: ErrorType | 'connection_error' | 'webhook_signature_error'
  readonly code: string
  readonly param: string | null
  readonly statusCode: number | null
  readonly requestId: string | null

  constructor(
    message: string,
    fields: {
      type: KetaPayError['type']
      code: string
      param?: string | null
      statusCode?: number | null
      requestId?: string | null
    },
  ) {
    super(message)
    this.name = new.target.name
    this.type = fields.type
    this.code = fields.code
    this.param = fields.param ?? null
    this.statusCode = fields.statusCode ?? null
    this.requestId = fields.requestId ?? null
  }
}

/** A parameter is missing or invalid, or the object is in the wrong state (400, 404, 409). */
export class InvalidRequestError extends KetaPayError {}
/** The key is missing, malformed or revoked (401). */
export class AuthenticationError extends KetaPayError {}
/** The key lacks a scope, or the customer token is not allowed to do this (403). */
export class PermissionError extends KetaPayError {}
/** The Idempotency-Key was reused with a different request (409). */
export class IdempotencyError extends KetaPayError {}
/** Too many requests for this key (429). Retried automatically up to `maxRetries`. */
export class RateLimitError extends KetaPayError {}
/** Something failed on KetaPay's side (5xx). Retried automatically up to `maxRetries`. */
export class APIError extends KetaPayError {}
/** The request never got a response: network failure or timeout. */
export class ConnectionError extends KetaPayError {}
/** A webhook signature did not verify. Reject the request. */
export class WebhookSignatureError extends KetaPayError {}

const classByType: Record<ErrorType, typeof KetaPayError> = {
  invalid_request_error: InvalidRequestError,
  authentication_error: AuthenticationError,
  permission_error: PermissionError,
  idempotency_error: IdempotencyError,
  rate_limit_error: RateLimitError,
  api_error: APIError,
}

function typeForStatus(status: number): ErrorType {
  if (status === 401) return 'authentication_error'
  if (status === 403) return 'permission_error'
  if (status === 429) return 'rate_limit_error'
  if (status >= 500) return 'api_error'
  return 'invalid_request_error'
}

export function errorFromResponse(status: number, body: unknown, requestId: string | null): KetaPayError {
  const err: ErrorBody = (body as { error?: ErrorBody } | null)?.error ?? {}
  const type = err.type && err.type in classByType ? err.type : typeForStatus(status)
  const ErrorClass = classByType[type]
  return new ErrorClass(err.message ?? `KetaPay API responded with HTTP ${status}`, {
    type,
    code: err.code ?? 'unknown_error',
    param: err.param ?? null,
    statusCode: status,
    requestId: err.request_id ?? requestId,
  })
}
