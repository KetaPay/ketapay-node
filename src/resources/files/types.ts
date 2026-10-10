import type { Schemas } from '../common/types.js'

export type FilePurpose = Schemas['FilePurpose']
export type KetaPayFile = Schemas['File']

export interface FileCreateParams {
  /** The file contents. */
  file: Blob | Uint8Array
  /** Shown to the buyer, seller and KetaPay. */
  filename: string
  purpose: FilePurpose
  /** Defaults to `application/octet-stream`; KetaPay detects the real type. */
  contentType?: string
}
