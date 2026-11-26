import type { Schemas } from '../common/types.js'

export interface TestPayParams {
  method?: 'card' | 'bank_transfer'
}

/** The sandbox verified the customer whose token you sent. */
export type CustomerVerification = Schemas['CustomerVerification']
