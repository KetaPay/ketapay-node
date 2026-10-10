import { APIPromise } from '../../core/api-promise.js'
import { InvalidRequestError } from '../../core/errors.js'
import type { RequestOptions } from '../../core/options.js'
import { Resource, seg } from '../../core/resource.js'
import type { CheckoutSession } from '../checkout/types.js'
import type { Escrow } from '../escrows/types.js'
import type { SimulateParams, TestPayParams } from './types.js'

/** Sandbox only. With a live key every call fails at once, without contacting KetaPay. */
export class TestHelpers extends Resource {
  readonly checkoutSessions = {
    /** Pays the session as if the buyer did. */
    pay: (id: string, params?: TestPayParams, options?: RequestOptions): APIPromise<CheckoutSession> =>
      this.sandbox() ??
      this.http.request('POST', `/test_helpers/checkout_sessions/${seg(id)}/pay`, { body: params ?? {}, options }),
  }

  readonly escrows = {
    /** Does what a buyer, seller, bank or KetaPay would do, with the same rules and webhooks. */
    simulate: (id: string, params: SimulateParams, options?: RequestOptions): APIPromise<Escrow> =>
      this.sandbox() ??
      this.http.request('POST', `/test_helpers/escrows/${seg(id)}/simulate`, { body: params, options }),
  }

  private sandbox<T>(): APIPromise<T> | undefined {
    if (!this.http.livemode) return undefined
    return APIPromise.reject(
      new InvalidRequestError('Test helpers only work with sk_test_ keys', {
        type: 'invalid_request_error',
        code: 'test_mode_only',
      }),
    )
  }
}
