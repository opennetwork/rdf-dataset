import {
  isQuad,
  DefaultDataFactory,
  Quad,
  QuadLike
} from "@opennetwork/rdf-data-model"
import {FilterIterateeFn, ReadonlyDataset} from "./readonly-dataset"
import { QuadFind } from "./match"
import { SetLike } from "./set-like"

export interface Dataset extends ReadonlyDataset<Quad> {

}

export interface PartitionFilterFn extends FilterIterateeFn<Quad | QuadLike | QuadFind> {

}

export interface Dataset {
  add(value: Quad | QuadLike): Dataset
  addAll(dataset: Iterable<Quad | QuadLike>): Dataset
  import(dataset: AsyncIterable<Quad | QuadLike>, eager?: boolean): Promise<unknown>
  delete(quad: Quad | QuadLike | QuadFind): Dataset
  partition(match: PartitionFilterFn): Dataset
}

export class Dataset extends ReadonlyDataset {

  readonly #set: SetLike<Quad>

  readonly #partitions: [PartitionFilterFn, Dataset][] = []

  constructor(set: SetLike<Quad> = new Set()) {
    super(set)
    this.#set = set
  }

  has(find: Quad | QuadFind): boolean {
    if (isQuad(find) && this.#set.has && this.#set.has(find)) {
      return true
    }
    return super.has(find)
  }

  add(value: Quad | QuadLike): Dataset {
    const quad = isQuad(value) ? value : DefaultDataFactory.fromQuad(value)
    if (this.has(quad)) {
      return this
    }
    this.#set.add(quad)
    return this
  }

  addAll(dataset: Iterable<Quad | QuadLike>): Dataset {
    for (const value of new Set(dataset)) {
      this.add(value)
    }
    return this
  }

  async import(dataset: AsyncIterable<Quad | QuadLike>, eager?: boolean): Promise<unknown> {
    const values = new Set<Quad | QuadLike>()
    for await (const value of dataset) {
      if (eager) {
        this.add(value)
      } else {
        values.add(value)
      }
    }
    this.addAll(values)
    return undefined
  }

  delete(quad: Quad | QuadLike | QuadFind): Dataset {
    for (const matched of this.match(quad)) {
      this.deleteSource(matched)
    }
    return this
  }

  protected deleteSource(quad: Quad) {
    this.#set.delete(quad)
  }

  get size() {
    return this.#set.size
  }

  partition(match: PartitionFilterFn) {
    return constructPartition.call(
      this,
      this.#set,
      match,
      this.#partitions,
      (set: SetLike<Quad>) => new Dataset(set)
    )
  }

  *[Symbol.iterator]():  Generator<Quad, void, undefined> {
    if (this.#partitions.length === 0) {
      return yield* super[Symbol.iterator]()
    }

    yield* this.#set

    for (const [, set] of this.#partitions) {
      yield* set
    }

  }

}

export function constructSet<T>(set: SetLike<T>, initial?: Iterable<T>): SetLike<T> {
  if (set.construct) {
    return set.construct(initial)
  } else {
    return new Set(initial)
  }
}

export function constructPartition(this: Dataset, set: SetLike<Quad>, match: PartitionFilterFn, partitions: [PartitionFilterFn, Dataset][], construct: (set: SetLike<Quad>) => Dataset): Dataset {
  const found = partitions.find(([fn]) => fn === match)
  if (found) {
    return found[1]
  }
  const partitionData = constructSet(set, this.filter(match))
  // Remove from primary
  for (const matched of partitionData) {
    this.deleteSource(matched)
  }
  const partitionSet = construct(partitionData)
  partitions.push([match, partitionSet])
  return partitionSet
}
