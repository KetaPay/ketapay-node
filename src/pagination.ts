export interface Page<T> {
  object: 'list'
  data: T[]
  has_more: boolean
  next_cursor: string | null
}

/**
 * The result of a list call. `await` it for one page, or iterate it with `for await` to walk every
 * item across pages:
 *
 *   for await (const escrow of ketapay.escrows.list({ status: 'active' })) { ... }
 */
export class PagePromise<T> implements PromiseLike<Page<T>>, AsyncIterable<T> {
  constructor(private readonly fetchPage: (cursor: string | undefined) => Promise<Page<T>>) {}

  then<A = Page<T>, B = never>(
    onFulfilled?: ((page: Page<T>) => A | PromiseLike<A>) | null,
    onRejected?: ((reason: unknown) => B | PromiseLike<B>) | null,
  ): Promise<A | B> {
    return this.fetchPage(undefined).then(onFulfilled, onRejected)
  }

  async *[Symbol.asyncIterator](): AsyncIterator<T> {
    let cursor: string | undefined
    for (;;) {
      const page = await this.fetchPage(cursor)
      yield* page.data
      if (!page.has_more || !page.next_cursor) return
      cursor = page.next_cursor
    }
  }
}
