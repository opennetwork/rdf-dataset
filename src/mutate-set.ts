import {Quad} from "@opennetwork/rdf-data-model"
import {MutateDataset} from "./mutate-dataset"

export interface SetLike<T> extends Iterable<T> {
  add(value: T): void
  delete(value: T): void
  has?(value: T): void
}

export function mutateSet(source: SetLike<Quad> = new Set()): MutateDataset {
  const mutate: MutateDataset = {
    construct(source: Iterable<Quad>): MutateDataset {
      return mutateSet(new Set(source))
    },
    add(value: Quad) {
      source.add(value)
    },
    addAll(values: Iterable<Quad>) {
      for (const value of values) {
        source.add(value)
      }
    },
    async import(dataset: AsyncIterable<Quad>, eager?: boolean) {
      const values = new Set<Quad>()
      for await (const value of dataset) {
        if (eager) {
          this.add(value)
        } else {
          values.add(value)
        }
      }
      if (values.size) {
        this.addAll(values)
      }
    },
    delete(quad: Quad) {
      source.delete(quad)
    },
    *[Symbol.iterator]() {
      yield* source
    }
  }

  if (source.has) {
    mutate.has = source.has.bind(source)
  }

  return mutate
}
