// Types shared by several domains. Generated from the spec, except the "one of these fields"
// inputs, which the generator can only express loosely and are written out exactly here.
import type { components } from '../../generated/openapi.js'

export type Schemas = components['schemas']

export type Amount = Schemas['Amount']
export type Metadata = Schemas['Metadata']
export type Category = Schemas['Category']
export type Deleted = Schemas['Deleted']
export type ApiErrorBody = Schemas['Error']

type FileOrUrl = { file: string; url?: string } | { url: string; file?: string }
/** An image: an id from `files.create()` or an HTTPS link. */
export type ImageInput = FileOrUrl & { alt?: string | null }
/** A document: an id from `files.create()` or an HTTPS link. */
export type AttachmentInput = FileOrUrl & { name?: string }
export type Image = Schemas['Image']
export type Attachment = Schemas['Attachment']

/** A buyer or seller: at least one of `email` and `phone`, both if you have them. */
export type PartyInput =
  { email: string; phone?: string; name?: string | null } | { phone: string; email?: string; name?: string | null }
export type Party = Schemas['Party']

/** A list that is not paginated. */
export interface List<T> {
  object: 'list'
  data: T[]
}
