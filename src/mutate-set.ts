import {Quad} from "@opennetwork/rdf-data-model"
import {MutateDataset} from "./mutate-dataset"
import {withoutMatched} from "./match";

export interface SetLike<T> extends Iterable<T> {
  add(value: T): void
  delete(value: T): boolean
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
    deleteMatches(match) {
      const [deleted, doCollection] = collect()
      drain(withoutMatched(this, match, true, doCollection));
      this.deleteAll(deleted);
      return deleted
    },
    deleteAll(values: Iterable<Quad>): Iterable<Quad> {
      const had = new Set<Quad>()
      for (const value of values) {
        const deleted = source.delete(value)
        if (deleted) {
          had.add(value)
        }
      }
      return had
    },
    delete(quad: Quad) {
      const deleted = source.delete(quad)
      return deleted ? [quad] : []
    },
    *[Symbol.iterator]() {
      yield* source
    }
  }

  function drain(iterable: Iterable<unknown>) {
    for (const value of iterable);
  }

  function collect(): [Quad[], (quad: Quad) => void] {
    const collected: Quad[] = []
    function doCollection(quad: Quad) {
      collected.push(quad)
    }
    return [collected, doCollection]
  }

  if (source.has) {
    mutate.has = source.has.bind(source)
  }

  return mutate
}
