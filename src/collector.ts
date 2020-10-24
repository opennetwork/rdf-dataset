import promiseDefer from "promise.defer"

export class Collector<T, O> implements AsyncIterable<O> {

  #active = true
  #values: T[] = []
  #nextResolve: (value: O) => void | undefined = undefined
  #nextPromise: Promise<O> | undefined = undefined

  readonly #map: (input: T[]) => O

  constructor(map: (input: T[]) => O) {
    this.#map = map
  }

  add(value: T) {
    if (!this.#active) return
    this.#values.push(value)
    if (!this.#nextResolve) return // Resolve has been taken care of
    const resolve = this.#nextResolve
    this.#nextResolve = undefined
    Promise.resolve().then(() => {
      const current = this.#values
      // Start again
      this.#values = []
      this.#nextPromise = undefined
      resolve(this.#map(current))
    })
  }

  close() {
    this.#active = false
  }

  async *[Symbol.asyncIterator](): AsyncIterator<O> {
    do {
      if (!this.#nextPromise) {
        const defer = promiseDefer<O>()
        this.#nextPromise = defer.promise
        this.#nextResolve = defer.resolve
      }
      yield this.#nextPromise
    } while (this.#active)
  }

}
