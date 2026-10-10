export interface WithResponse<T> {
  data: T
  /** The raw response, for headers such as `X-RateLimit-Remaining`. Its body has been read. */
  response: Response
  /** `KetaPay-Request-Id`: quote it to KetaPay support. */
  requestId: string | null
}

/**
 * What every API method returns. `await` it for the data, or call `.withResponse()` for the data
 * plus the raw response and request id:
 *
 *   const { data: escrow, requestId } = await ketapay.escrows.retrieve(id).withResponse()
 */
export class APIPromise<T> implements PromiseLike<T> {
  constructor(private readonly result: Promise<WithResponse<T>>) {}

  /** A promise that has already failed, for checks made before any request is sent. */
  static reject<T>(error: unknown): APIPromise<T> {
    const result = Promise.reject(error)
    result.catch(() => {}) // the caller handles it when they await; avoid an unhandled-rejection warning first
    return new APIPromise<T>(result)
  }

  withResponse(): Promise<WithResponse<T>> {
    return this.result
  }

  then<A = T, B = never>(
    onFulfilled?: ((value: T) => A | PromiseLike<A>) | null,
    onRejected?: ((reason: unknown) => B | PromiseLike<B>) | null,
  ): Promise<A | B> {
    return this.result.then((r) => r.data).then(onFulfilled, onRejected)
  }

  catch<B = never>(onRejected?: ((reason: unknown) => B | PromiseLike<B>) | null): Promise<T | B> {
    return this.then(undefined, onRejected)
  }

  finally(onFinally?: (() => void) | null): Promise<T> {
    return this.then().finally(onFinally)
  }
}
