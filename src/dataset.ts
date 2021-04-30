import {
  isQuad,
  Quad,
  QuadLike
} from "@opennetwork/rdf-data-model"
import {ReadonlyDataset} from "./readonly-dataset"
import { QuadFind } from "./match"
import {MutateDataset} from "./mutate-dataset"
import {mutateArray} from "./mutate-array"
import {DatasetOptions} from "./dataset-options"
import {PartitionFilterFn} from "./partition-filter"

export interface Dataset extends ReadonlyDataset<Quad> {

}

export interface Dataset {
  add(value: Quad): Dataset
  addAll(dataset: Iterable<Quad>): Dataset
  import(dataset: AsyncIterable<Quad>, eager?: boolean): Promise<unknown>
  delete(quad: Quad | QuadFind): Dataset
  partition?(match: PartitionFilterFn): Dataset
  unpartition?(match: PartitionFilterFn): void
  close?(): void
}

function matchPartition(input: Iterable<Quad>, options: DatasetOptions): Iterable<Quad> {
  if (!options.match) {
    return input
  }
  return new ReadonlyDataset(input).filter(options.match)
}

export class Dataset extends ReadonlyDataset {

  readonly #mutate: MutateDataset

  readonly #partitions: [PartitionFilterFn, Dataset][] = []

  readonly #options: Readonly<DatasetOptions>

  constructor(options: DatasetOptions = { mutate: mutateArray() }) {
    super(matchPartition(options.mutate, options))
    this.#mutate = options.mutate
    this.#options = Object.freeze(options)

    if (options.watch) {
      this[Symbol.asyncIterator] = options.watch[Symbol.asyncIterator].bind(options.watch)
      this.close = options.watch.close?.bind(options.watch)
    }

    if (!this.#mutate.construct) {
      this.partition = undefined
      this.unpartition = undefined
    }
  }

  has(match: Quad | QuadFind): boolean {

    if (this.#mutate.has && isQuad(match)) {
      return this.#mutate.has(match)
    }

    return super.has(match)
  }

  add(quad: Quad): Dataset {
    if (this.#options.match && !this.#options.match(quad)) {
      throw new Error("This Quad cannot be added to this dataset, the Dataset is a partition with a given match filter that disallows this, as a best practice, please write to the core Dataset")
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
      this.#mutate.add(quad)
      this.#options.watch?.add(quad)
    }

    return this
  }

  addAll(dataset: Iterable<Quad>): Dataset {
    if (this.#partitions.length) {
      // If we have partitions,
      for (const value of dataset) {
        this.add(value)
      }
    } else {
      this.#addAllToMutate(dataset, false)
    }
    return this
  }

  #addAllToMutate = (dataset: Iterable<Quad>, withoutWatch?: boolean) => {
    this.#mutate.addAll(dataset)
    if (!withoutWatch) {
      this.#options.watch?.addAll(dataset)
    }
  }

  async import(dataset: AsyncIterable<Quad>, eager?: boolean): Promise<unknown> {
    const values: Quad[] = []
    for await (const value of dataset) {
      if (eager) {
        this.add(value)
      } else {
        values.push(value)
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

    const deletedAll = (iterable: Iterable<Quad>) => {
      const watch = this.#options.watch
      if (watch.deleteAll) {
        watch.deleteAll(iterable)
      } else if (watch.delete) {
        (Array.isArray(iterable) ? iterable : [...iterable]).forEach(watch.delete)
      }
    }

    if (this.#mutate.deleteMatches) {
      deletedAll(this.#mutate.deleteMatches(quad))
    } else if (!isQuad(quad)) {
      // Partition deletes will directly use `this.match`, which
      for (const matched of this.match(quad)) {
        // If the quad is a matching quad rather than a full quad then see if we have to delete again
        // just in case these partitions only match on full quads only
        if (!isQuad(quad)) {
          for (const partition of this.matchPartitions(matched)) {
            // If we deleted it earlier, we don't need to delete it again from that partition
            if (basePartitions.has(partition)) {
              continue
            }
            partition.delete(matched)
          }
        }
        if (!this.#mutate.deleteMatches) {
          deletedAll(this.#mutate.delete(matched))
        }
      }
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

  get size() {
    // If we have a matcher, the actual size may be different from the
    // set size, meaning we won't have an accurate value, `super.size` iterates the source and calculates the size
    if (this.#options.match) {
      return super.size
    }
    const mutatedSize = this.#mutate.size
    if (typeof mutatedSize === "number") {
      return mutatedSize
    }
    return super.size
  }

  partition?(match: PartitionFilterFn) {
    if (!this.#mutate.construct) {
      throw new Error("This dataset cannot be partitioned")
    }
    const found = this.#partitions.find(([fn]) => fn === match)
    if (found) {
      return found[1]
    }
    const partitionMutate = this.#mutate.construct(this.filter(match))
    // Remove from primary
    for (const matched of partitionMutate) {
      this.#mutate.delete(matched)
    }
    const partitionSet = new Dataset({
      mutate: partitionMutate,
      match,
      watch: this.#options.watch?.partition?.(match) || this.#options.watch
    })
    this.#partitions.push([match, partitionSet])
    return partitionSet
  }

  unpartition?(match: PartitionFilterFn) {
    const partitionIndex = this.#partitions.findIndex(([fn]) => fn === match)
    if (partitionIndex === -1) {
      return
    }
    const [,partition] = this.#partitions[partitionIndex]
    // Remove partition, no longer is added to, but now data is within this dataset
    this.#partitions.splice(partitionIndex, 1)
    this.#options.watch?.unpartition?.(match)
    // ... so we retain partition contents back into the dataset
    // We don't want to trigger a watcher change
    this.#addAllToMutate(partition, true)
  }

  *[Symbol.iterator]():  Generator<Quad, void, undefined> {
    if (this.#partitions.length === 0) {
      // See constructor for partitions role in this value
      return yield* super[Symbol.iterator]()
    }

    yield* matchPartition(this.#mutate, this.#options)

    for (const [, set] of this.#partitions) {
      yield* matchPartition(set, this.#options)
    }

  }

}
