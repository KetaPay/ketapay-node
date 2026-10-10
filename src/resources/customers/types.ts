import type { Schemas } from '../common/types.js'

/** Exactly one of `email` and `phone`: the one-time code goes there. */
export type CustomerSessionCreateParams = { email: string; phone?: never } | { phone: string; email?: never }
export type CustomerSession = Schemas['CustomerSession']
export type CustomerToken = Schemas['CustomerToken']
