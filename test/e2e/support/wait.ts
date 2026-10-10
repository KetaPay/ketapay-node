/**
 * Retries an assertion until it passes or the time runs out. For effects that land a moment after the
 * API call returns (events, payouts, refunds), instead of checking once and failing on timing.
 */
export async function eventually<T>(
  check: () => Promise<T>,
  { timeoutMs = 10_000, intervalMs = 500 } = {},
): Promise<T> {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    try {
      return await check()
    } catch (err) {
      if (Date.now() >= deadline) throw err
      await new Promise((resolve) => setTimeout(resolve, intervalMs))
    }
  }
}
