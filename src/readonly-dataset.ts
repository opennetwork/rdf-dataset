import { DefaultDataFactory, isQuad, isQuadLike, Quad, QuadLike } from "@opennetwork/rdf-data-model"
import { isMatch, QuadFind } from "./match"

export interface FilterIterateeFn<T> {
  (value: T): boolean
}

export interface FilterIterateeIsFn<T, R extends T = T> {
  (value: T): value is R
}

export interface RunIteratee<T> {
  (value: T): void
}

export interface MapIteratee<T, R> {
  (value: T): R
}

export interface ReadonlyDataset<Q extends Quad = Quad> extends Iterable<Q> {

}

export interface ReadonlyDataset<Q extends Quad = Quad> {
  filter<R extends Q = Q>(iteratee: FilterIterateeIsFn<Q, R>): ReadonlyDataset<R>
  filter(iteratee: FilterIterateeFn<Q>): ReadonlyDataset<Q>
  except(iteratee: FilterIterateeFn<Q>): ReadonlyDataset<Q>
  match(find: Quad | QuadFind): ReadonlyDataset<Q>
  match<R extends Q = Q>(find: R): ReadonlyDataset<R>
  match<R extends Partial<Q> = Q>(find: R): ReadonlyDataset<Q & R>
  without(find: Quad | QuadFind): ReadonlyDataset<Q>
  has(find: Quad | QuadFind): boolean
  contains(dataset: Iterable<Quad | QuadLike>): boolean
  difference(dataset: Iterable<Quad | QuadLike>): ReadonlyDataset
  equals(dataset: Iterable<Quad | QuadLike>): boolean
  every(iteratee: FilterIterateeFn<Q>): boolean
  forEach(iteratee: RunIteratee<Q>): void
  intersection(dataset: Iterable<Quad | QuadLike>): ReadonlyDataset
  map(iteratee: MapIteratee<Q, QuadLike>): ReadonlyDataset
  some(iteratee: FilterIterateeFn<Q>): boolean
  toArray(): Q[]
  union(dataset: Iterable<Quad | QuadLike>): ReadonlyDataset
}

function *quads(quads: Iterable<Quad | QuadLike>): Iterable<Quad> {
  for (const quad of quads) {
    if (isQuad(quad)) {
      yield quad
    } else {
      yield DefaultDataFactory.fromQuad(quad)
    }
  }
}

export class ReadonlyDataset<Q extends Quad = Quad> implements ReadonlyDataset<Q>, Iterable<Q> {

  readonly #source: Iterable<Q> | undefined

  constructor(source?: Iterable<Q>) {
    this.#source = source
  }

  filter<R extends Q = Q>(iteratee: FilterIterateeIsFn<Q, R>): ReadonlyDataset<R>
  filter(iteratee: FilterIterateeFn<Q>): ReadonlyDataset<Q>
  filter(iteratee: FilterIterateeFn<Q>): ReadonlyDataset<Q> {
    return new ReadonlyDataset({
      [Symbol.iterator]: filter.bind(this)
    })
    function *filter() {
      for (const value of this) {
        if (iteratee(value)) {
          yield value
        }
      }
    }
  }

  except(iteratee: FilterIterateeFn<Q>): ReadonlyDataset<Q> {
    return new ReadonlyDataset({
      [Symbol.iterator]: except.bind(this)
    })
    function* except() {
      for (const value of this) {
        if (!iteratee(value)) {
          yield value
        }
      }
    }
  }

  match<R extends Q = Q>(find: R): ReadonlyDataset<R>
  match<R extends Partial<Q> = Q>(find: R): ReadonlyDataset<Q & R>
  match(find: Quad | QuadFind): ReadonlyDataset<Q>
  match(find: Quad | QuadFind): ReadonlyDataset<Q> {
    return this.filter((quad: Q): quad is Q => isMatch(quad, find))
  }

  has(find: Quad | QuadFind): boolean {
    return !this.match(find).empty
  }

  contains(dataset: Iterable<Quad | QuadLike>): boolean {
    return new ReadonlyDataset(quads(dataset)).every(value => this.has(value))
  }

  difference(dataset: Iterable<Quad | QuadLike>): ReadonlyDataset {
    return new ReadonlyDataset(quads(dataset)).except(value => this.has(value))
  }

  equals(dataset: Iterable<Q | QuadLike>): boolean {
    return new ReadonlyDataset(quads(dataset)).every(value => this.has(value))
  }

  every(iteratee: FilterIterateeFn<Q>): boolean {
    return this.except(iteratee).empty
  }

  forEach(iteratee: RunIteratee<Q>): void {
    for (const value of this) {
      iteratee(value)
    }
  }

  intersection(dataset: Iterable<Quad | QuadLike>): ReadonlyDataset {
    return new ReadonlyDataset(quads(dataset)).filter(value => this.has(value))
  }

  map(iteratee: MapIteratee<Q, QuadLike>): ReadonlyDataset {
    return new ReadonlyDataset({
      [Symbol.iterator]: map.bind(this)
    })
    function *map() {
      for (const value of this) {
        const returnedValue = iteratee(value)
        if (isQuad(returnedValue)) {
          yield returnedValue
        } else if (isQuadLike(returnedValue)) {
          yield DefaultDataFactory.fromQuad(returnedValue)
        }
        // else the returned value is a dud and we don't want it
      }
    }
  }

  some(iteratee: FilterIterateeFn<Q>): boolean {
    return !this.filter(iteratee).empty
  }

  toArray(): Q[] {
    return Array.from(this)
  }

  union(dataset: Iterable<Quad | QuadLike>): ReadonlyDataset {
    return new ReadonlyDataset({
      [Symbol.iterator]: union.bind(this)
    })
    function *union() {
      // Take a snapshot of both before we start to yield, so we get a consistent "current view" of the two iterables
      // These are still "live" iterables and can be added to, but the changes won't take effect within this union
      const left = Array.from(this)
      const right = Array.from(dataset)
      yield *left
      yield *right
    }
  }

  *[Symbol.iterator]() {
    if (!this.#source) {
      return
    }
    yield* this.#source
  }

  get size() {
    // Snapshot size
    let size = -1
    const iterator = this[Symbol.iterator]()
    let next
    do {
      size += 1
      next = iterator.next()
    } while (!next.done)
    return size
  }

  get empty() {
    const iterator = this[Symbol.iterator]()
    const next = iterator.next()
    iterator.return()
    return next.done
  }
}
