import type { HttpClient, Query } from './http-client.js'
import type { RequestOptions } from './options.js'
import { PagePromise, type Page } from './pagination.js'

/** Base class for every API resource. Internal. */
export abstract class Resource {
  constructor(protected readonly http: HttpClient) {}

  protected paginate<T>(path: string, query: Query | undefined, options?: RequestOptions): PagePromise<T> {
    return new PagePromise<T>((cursor) =>
      this.http.send<Page<T>>('GET', path, {
        query: cursor ? { ...query, cursor } : query,
        options,
      }),
    )
  }
}

/** Encodes one path segment, so an id can never change the route. */
export function seg(value: string): string {
  if (!value) throw new TypeError('KetaPay: an id is required')
  return encodeURIComponent(value)
}
