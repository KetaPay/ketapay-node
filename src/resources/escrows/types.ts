import type { operations } from '../../generated/openapi.js'
import type { AttachmentInput, Schemas } from '../common/types.js'

export type Escrow = Schemas['Escrow']
export type EscrowStatus = Schemas['EscrowStatus']
export type Milestone = Schemas['Milestone']
export type MilestoneStatus = Schemas['MilestoneStatus']
export type Delivery = Schemas['Delivery']
export type TimelineEntry = Schemas['TimelineEntry']
export type ReleaseCode = Schemas['ReleaseCode']
export type Flag = Schemas['Flag']

export type EscrowListParams = NonNullable<operations['listEscrows']['parameters']['query']>
export type EscrowFlagParams = Schemas['CreateFlagRequest']
export type MilestoneDeliverParams = Omit<Schemas['DeliverMilestoneRequest'], 'attachments'> & {
  attachments?: AttachmentInput[]
}
export type MilestoneReleaseParams = Schemas['ReleaseMilestoneRequest']
