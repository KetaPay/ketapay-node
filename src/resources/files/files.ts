import type { APIPromise } from '../../core/api-promise.js'
import type { RequestOptions } from '../../core/options.js'
import { Resource } from '../../core/resource.js'
import type { FileCreateParams, KetaPayFile } from './types.js'

export class Files extends Resource {
  /**
   * Uploads a file your customer gave you, for a milestone delivery (`delivery`, the seller's token)
   * or dispute evidence (`dispute_evidence`, the buyer's or seller's token). Checkout images and
   * attachments take links instead: KetaPay copies them.
   */
  create(params: FileCreateParams, options?: RequestOptions): APIPromise<KetaPayFile> {
    const blob =
      params.file instanceof Blob
        ? params.file
        : // Copied so a view over shared memory (which Blob can't take) works too.
          new Blob([new Uint8Array(params.file)], { type: params.contentType ?? 'application/octet-stream' })
    const form = new FormData()
    form.append('file', blob, params.filename)
    form.append('purpose', params.purpose)
    return this.http.request('POST', '/files', { form, options })
  }
}
