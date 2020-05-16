import { DefaultDataFactory, isQuad, isQuadLike, Quad, QuadLike } from "@opennetwork/rdf-data-model"
import { isMatch, QuadFind } from "./match"

export interface FilterIterateeFn<T> {
  (value: T): boolean
}

export interface RunIteratee<T> {
  (value: T): void
}

export interface MapIteratee<T, R> {
  (value: T): R
}

export interface ReadonlyDataset extends Iterable<Quad> {

}

export interface ReadonlyDataset {
  filter(iteratee: FilterIterateeFn<Quad>): ReadonlyDataset
  except(iteratee: FilterIterateeFn<Quad>): ReadonlyDataset
  match(find: Quad | QuadFind): ReadonlyDataset
  without(find: Quad | QuadFind): ReadonlyDataset
  has(find: Quad | QuadFind): boolean
  contains(dataset: Iterable<Quad | QuadLike>): boolean
  difference(dataset: Iterable<Quad | QuadLike>): ReadonlyDataset
  equals(dataset: Iterable<Quad | QuadLike>): boolean
  every(iteratee: FilterIterateeFn<Quad>): boolean
  forEach(iteratee: RunIteratee<Quad>): void
  intersection(dataset: Iterable<Quad | QuadLike>): ReadonlyDataset
  map(iteratee: MapIteratee<Quad, QuadLike>): ReadonlyDataset
  some(iteratee: FilterIterateeFn<Quad>): boolean
  toArray(): Quad[]
  union(dataset: Iterable<Quad | QuadLike>): ReadonlyDataset
}

export class ReadonlyDataset implements ReadonlyDataset, Iterable<Quad> {

  readonly #source: Iterable<Quad | QuadLike> | undefined

  constructor(source?: Iterable<Quad | QuadLike>) {
    this.#source = source
  }

  filter(iteratee: FilterIterateeFn<Quad>): ReadonlyDataset {
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

  except(iteratee: FilterIterateeFn<Quad>): ReadonlyDataset {
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

  match(find: Quad | QuadFind): ReadonlyDataset {
    return this.filter(quad => isMatch(quad, find))
  }

  has(find: Quad | QuadFind): boolean {
    return !this.match(find).empty
  }

  contains(dataset: Iterable<Quad | QuadLike>): boolean {
    return new ReadonlyDataset(dataset).every(value => this.has(value))
  }

  difference(dataset: Iterable<Quad | QuadLike>): ReadonlyDataset {
    return new ReadonlyDataset(dataset).except(value => this.has(value))
  }

  equals(dataset: Iterable<Quad | QuadLike>): boolean {
    return new ReadonlyDataset(dataset).every(value => this.has(value))
  }

  every(iteratee: FilterIterateeFn<Quad>): boolean {
    return this.except(iteratee).empty
  }

  forEach(iteratee: RunIteratee<Quad>): void {
    for (const value of this) {
      iteratee(value)
    }
  }

  intersection(dataset: Iterable<Quad | QuadLike>): ReadonlyDataset {
    return new ReadonlyDataset(dataset).filter(value => this.has(value))
  }

  map(iteratee: MapIteratee<Quad, QuadLike>): ReadonlyDataset {
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

  some(iteratee: FilterIterateeFn<Quad>): boolean {
    return !this.filter(iteratee).empty
  }

  toArray(): Quad[] {
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
    for (const value of this.#source) {
      const quad = isQuad(value) ? value : DefaultDataFactory.fromQuad(value)
      yield quad
    }
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
