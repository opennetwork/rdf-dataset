import {Quad, QuadLike} from "@opennetwork/rdf-data-model"
import {QuadFind} from "./match"
import {ReadonlyDataset} from "./readonly-dataset"
import {MutateDataset} from "./mutate-dataset"

export function mutateSet(source: Set<Quad> = new Set()): MutateDataset {
  return {
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
    delete(match: Quad | QuadLike | QuadFind) {
      for (const quad of new ReadonlyDataset(source).match(match)) {
        source.delete(quad)
      }
    },
    *[Symbol.iterator]() {
      yield* source
    }
  }
}
