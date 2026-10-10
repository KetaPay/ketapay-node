import type { Schemas } from '../common/types.js'

export type SimulateParams = Schemas['SimulateRequest']

export interface TestPayParams {
  method?: 'card' | 'bank_transfer'
}
