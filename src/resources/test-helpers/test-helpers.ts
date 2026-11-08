import { APIPromise } from '../../core/api-promise.js'
import { InvalidRequestError } from '../../core/errors.js'
import type { RequestOptions } from '../../core/options.js'
import { Resource, seg } from '../../core/resource.js'
import type { CheckoutSession } from '../checkout/types.js'
import type { CustomerVerification, TestPayParams } from './types.js'

/** Sandbox only. With a live key every call fails at once, without contacting KetaPay. */
export class TestHelpers extends Resource {
  readonly checkoutSessions = {
    /** Pays the session as if the buyer did. */
    pay: (id: string, params?: TestPayParams, options?: RequestOptions): APIPromise<CheckoutSession> =>
      this.sandbox() ??
      this.http.request('POST', `/test_helpers/checkout_sessions/${seg(id)}/pay`, { body: params ?? {}, options }),
  }

  readonly customers = {
    /**
     * Verifies the customer whose token you send (`options.customerToken`), as finishing hosted
     * verification would. Their payouts held as `awaiting_verification` go on to their payout account.
     */
    verify: (options?: RequestOptions): APIPromise<CustomerVerification> =>
      this.sandbox() ?? this.http.request('POST', '/test_helpers/customers/verify', { body: {}, options }),
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
