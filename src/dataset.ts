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

export interface DatasetOptions {
  match?: PartitionFilterFn
}

function matchPartition(input: Iterable<Quad>, options: DatasetOptions): Iterable<Quad> {
  if (!options.match) {
    return input
  }
  return new ReadonlyDataset(input).filter(options.match)
}

export class Dataset extends ReadonlyDataset {

  readonly #set: SetLike<Quad>

  readonly #partitions: [PartitionFilterFn, Dataset][] = []

  readonly #options: Readonly<DatasetOptions>

  constructor(set: SetLike<Quad> = new Set(), options: DatasetOptions = {}) {
    super(matchPartition(set, options))
    this.#set = set
    this.#options = Object.freeze(options)
  }

  has(find: Quad | QuadFind): boolean {

    // If it is a quad and does not match our filter, it is not within this partition
    if (isQuad(find) && this.#options.match && !this.#options.match(find)) {
      return false
    }

    // Shortcut, sadly this does not shortcut for partitions...
    if (isQuad(find) && this.#set.has && this.#set.has(find)) {
      return true
    }
    return super.has(find)
  }

  add(value: Quad | QuadLike): Dataset {
    const quad = isQuad(value) ? value : DefaultDataFactory.fromQuad(value)

    if (this.#options.match && !this.#options.match(quad)) {
      throw new Error("This Quad cannot be added to this dataset, the Dataset is a partition with a given match filter that disallows this, as a best practice, please write to the core Dataset")
    }

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
    // Partition deletes will directly use `this.match`, which
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
    // If we have a matcher, the actual size may be different from the
    // set size, meaning we won't have an accurate value, `super.size` iterates the source and calculates the size
    if (this.#options.match) {
      return super.size
    }
    return this.#set.size
  }

  partition(match: PartitionFilterFn) {
    const found = this.#partitions.find(([fn]) => fn === match)
    if (found) {
      return found[1]
    }
    const partitionData = this.constructSet(this.filter(match))
    // Remove from primary
    for (const matched of partitionData) {
      this.deleteSource(matched)
    }
    const partitionSet = new Dataset(partitionData, {
      match
    })
    this.#partitions.push([match, partitionSet])
    return partitionSet
  }

  unpartition(match: PartitionFilterFn) {
    const partitionIndex = this.#partitions.findIndex(([fn]) => fn === match)
    if (partitionIndex === -1) {
      return
    }
    const [,partition] = this.#partitions[partitionIndex]
    // Remove partition, no longer is added to, but now data is within this dataset
    this.#partitions.splice(partitionIndex, 1)

    // ... so we retain partition contents back into the dataset
    this.addAll(partition)
  }

  protected constructSet(initial?: Iterable<Quad>): SetLike<Quad> {
    const { construct } = this.#set
    if (construct) {
      return construct(initial)
    } else {
      return new Set(initial)
    }
  }

  *[Symbol.iterator]():  Generator<Quad, void, undefined> {
    if (this.#partitions.length === 0) {
      // See constructor for partitions role in this value
      return yield* super[Symbol.iterator]()
    }

    yield* matchPartition(this.#set, this.#options)

    for (const [, set] of this.#partitions) {
      yield* matchPartition(set, this.#options)
    }

  }

}
