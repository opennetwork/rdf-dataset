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
  unpartition(match: PartitionFilterFn): void
}

export class Dataset extends ReadonlyDataset {

  readonly #set: SetLike<Quad>

  readonly #partitions: [PartitionFilterFn, Dataset][] = []

  constructor(set: SetLike<Quad> = new Set()) {
    super(set)
    this.#set = set
  }

  has(find: Quad | QuadFind): boolean {
    // Shortcut, sadly this does not shortcut for partitions...
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
    const partitions = new Set(this.matchPartitions(quad))

    if (partitions.size > 1) {
      const error: Error & { partitions?: Set<Dataset>, quad?: Quad } = new Error(`Multiple partitions match the quad ${JSON.stringify(quad)}`)
      error.partitions = partitions
      error.quad = quad
      throw error
    }

    if (partitions.size === 1) {
      const [partition] = [...partitions]
      partition.add(quad)
    } else {
      this.#set.add(quad)
    }

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
    // Deletes saturate the partitions for instances of the quad, even though only a single partition should contain
    // the quad...
    const basePartitions = new Set(this.matchPartitions(quad))
    for (const partition of basePartitions) {
      // If this deletes all instances of the quad, the following match will not iterate
      partition.delete(quad)
    }
    for (const matched of this.match(quad)) {
      for (const partition of this.matchPartitions(matched)) {
        // If we deleted it earlier, we don't need to delete it again from that partition
        if (basePartitions.has(partition)) {
          continue
        }
        partition.delete(matched)
      }
      this.deleteSource(matched)
    }
    return this
  }

  protected *matchPartitions(quad: Quad | QuadLike | QuadFind) {
    for (const [match, partition] of this.#partitions) {
      if (match(quad)) {
        yield partition
      }
    }
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

  unpartition(match: PartitionFilterFn) {
    return deconstructPartition.call(
      this,
      match,
      this.#partitions
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

export function deconstructPartition(this: Dataset, match: PartitionFilterFn, partitions: [PartitionFilterFn, Dataset][]) {
  const partitionIndex = partitions.findIndex(([fn]) => fn === match)
  if (partitionIndex === -1) {
    return
  }
  const [,partition] = partitions[partitionIndex]
  // Remove partition, no longer is added to, but now data is within this dataset
  partitions.splice(partitionIndex, 1)

  // ... so we retain partition contents back into the dataset
  this.addAll(partition)
}
