import { describe, expect, it } from 'vitest'
import { configured, env, RUN_ID } from '../support/env.js'

describe.skipIf(!configured || !env.liveKey)('e2e: live keys', () => {
  it('[E2E-024] the API refuses test helpers for a live key', async () => {
    // The SDK refuses before sending (SEC-005), so call the API directly to prove the server refuses too.
    const res = await fetch(`${env.baseUrl}/test_helpers/escrows/00000000-0000-4000-8000-000000000000/simulate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.liveKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `${RUN_ID}-live-${Date.now()}`,
      },
      body: JSON.stringify({ action: 'deliver' }),
    })
    expect(res.status).toBe(404)
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('test_mode_only')
  })
})
