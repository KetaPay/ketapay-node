import type { APIPromise } from '../../core/api-promise.js'
import type { CustomerRequestOptions } from '../../core/options.js'
import { Resource } from '../../core/resource.js'
import type { VerificationLink, VerificationLinkCreateParams } from './types.js'

/** Links for a seller to verify their identity once, coming back to your app or site. */
export class VerificationLinks extends Resource {
  /**
   * A link for the customer whose token you send to verify (their BVN and a selfie). Send them to
   * its `url`; once verified, the page offers a button back to `return_url`. Works for 24 hours.
   */
  create(params: VerificationLinkCreateParams, options: CustomerRequestOptions): APIPromise<VerificationLink> {
    return this.http.request('POST', '/verification_links', { body: params, options })
  }
}
