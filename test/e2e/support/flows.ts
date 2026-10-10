// Multi-step setups shared by several tests.
import type { CheckoutSessionCreateParams, Escrow, EventType } from '../../../src/index.js'
import { ketapay } from './client.js'
import { SANDBOX_CODE } from './env.js'
import { people, sessionParams } from './fixtures.js'

/** Signs a customer in with the sandbox code and returns their customer token. */
export async function tokenFor(email: string): Promise<string> {
  const k = ketapay()
  const session = await k.customerSessions.create({ email })
  return (await k.customerSessions.verify(session.id, SANDBOX_CODE)).token
}

/** Creates a checkout session, pays it with the test helper and returns the funded escrow and its parties. */
export async function fundedEscrow(overrides: Partial<CheckoutSessionCreateParams> = {}) {
  const who = people()
  const k = ketapay()
  const session = await k.checkoutSessions.create(sessionParams(who, overrides))
  const paid = await k.testHelpers.checkoutSessions.pay(session.id)
  const escrow = await k.escrows.retrieve(paid.escrow_id!)
  return { escrow, session: paid, buyer: who.buyer.email, seller: who.seller.email }
}

/** The first milestone of an escrow. */
export const first = (escrow: Escrow) => escrow.milestones[0]!

/** Events of a type whose object is, or belongs to, the given escrow. */
export async function eventsFor(escrow: Escrow, type: EventType) {
  const page = await ketapay().events.list({ type, limit: 100 })
  return page.data.filter((e) => {
    const obj = e.data.object as { id?: string; escrow_id?: string }
    return obj.id === escrow.id || obj.escrow_id === escrow.id
  })
}
