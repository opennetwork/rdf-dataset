import promiseDefer from "promise.defer"

export interface CollectorMapFn<T, O> {
  (input: T[]): O
}

export function defaultQueueMicrotask(fn: () => void): void {
  if (typeof queueMicrotask === "function") {
    queueMicrotask(fn)
  } else if (typeof setImmediate === "function") {
    setImmediate(fn)
  } else {
    setTimeout(fn, 0)
  }
}

export interface CollectorOptions<T, O> {
  map: CollectorMapFn<T, O>
  queueMicrotask?(fn: () => void): void
}

export class Collector<T, O> implements AsyncIterable<O> {

  #active = true
  #values: T[] = []
  #nextResolve: (value: O) => void | undefined = undefined
  #nextPromise: Promise<O> | undefined = undefined

  readonly #map: CollectorMapFn<T, O>
  readonly #queueMicrotask: typeof defaultQueueMicrotask
  readonly #iterators: Set<object> = new Set()

  constructor(options: CollectorOptions<T, O>) {
    this.#map = options.map
    this.#queueMicrotask = options.queueMicrotask || defaultQueueMicrotask
  }

  add(value: T) {
    if (!this.#active) return
    if (!this.#iterators.size) return // Do not add if there is nothing waiting on results
    this.#values.push(value)
    if (!this.#nextResolve) return // Resolve has been scheduled or invoked, and now we are in next batch
    const resolve = this.#nextResolve
    this.#nextResolve = undefined
    this.#queueMicrotask(() => {
      const current = this.#values
      // Start again
      this.#values = []
      this.#nextPromise = undefined
      resolve(this.#map(current))
    })
  }

  close() {
    this.#active = false
    this.#iterators.clear()
  }

  async *[Symbol.asyncIterator](): AsyncIterator<O> {
    if (!this.#active) return
    const id = {}
    try {
      this.#iterators.add(id)
      do {
        if (!this.#nextPromise) {
          const defer = promiseDefer<O>()
          this.#nextPromise = defer.promise
          this.#nextResolve = defer.resolve
        }
        yield this.#nextPromise
      } while (this.#active)
    } finally {
      this.#iterators.delete(id)
    }
  }

}
