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
  readonly type: ErrorType | 'connection_error' | 'aborted' | 'webhook_signature_error'
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

/** A parameter is missing or invalid, or the request isn't allowed right now (400). */
export class InvalidRequestError extends KetaPayError {}
/** No such object for this key and environment (404). */
export class NotFoundError extends InvalidRequestError {}
/** The object is in a state that doesn't allow this, for example `dispute_open` (409). */
export class ConflictError extends InvalidRequestError {}
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
/** You aborted the request with `signal`. */
export class RequestAbortedError extends KetaPayError {}
/** A webhook signature did not verify. Reject the request. */
export class WebhookSignatureError extends KetaPayError {}

function classFor(type: ErrorType, status: number): typeof KetaPayError {
  switch (type) {
    case 'invalid_request_error':
      return status === 404 ? NotFoundError : status === 409 ? ConflictError : InvalidRequestError
    case 'authentication_error':
      return AuthenticationError
    case 'permission_error':
      return PermissionError
    case 'idempotency_error':
      return IdempotencyError
    case 'rate_limit_error':
      return RateLimitError
    case 'api_error':
      return APIError
  }
}

function typeForStatus(status: number): ErrorType {
  if (status === 401) return 'authentication_error'
  if (status === 403) return 'permission_error'
  if (status === 429) return 'rate_limit_error'
  if (status >= 500) return 'api_error'
  return 'invalid_request_error'
}

const knownTypes = new Set<string>([
  'invalid_request_error',
  'authentication_error',
  'permission_error',
  'idempotency_error',
  'rate_limit_error',
  'api_error',
])

export function errorFromResponse(status: number, body: unknown, requestId: string | null): KetaPayError {
  const err: ErrorBody = (body as { error?: ErrorBody } | null)?.error ?? {}
  const type = err.type && knownTypes.has(err.type) ? err.type : typeForStatus(status)
  const ErrorClass = classFor(type, status)
  return new ErrorClass(err.message ?? `KetaPay API responded with HTTP ${status}`, {
    type,
    code: err.code ?? 'unknown_error',
    param: err.param ?? null,
    statusCode: status,
    requestId: err.request_id ?? requestId,
  })
}
