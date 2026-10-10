import type { APIPromise } from '../../core/api-promise.js'
import type { RequestOptions } from '../../core/options.js'
import { Resource } from '../../core/resource.js'
import type { FileCreateParams, KetaPayFile } from './types.js'

export class Files extends Resource {
  /**
   * Uploads a file for checkout attachments (`agreement`, your key alone), milestone deliveries
   * (`delivery`, seller's token) or dispute evidence (`dispute_evidence`, buyer's or seller's token).
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
