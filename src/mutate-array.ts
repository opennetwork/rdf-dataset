import {Quad, QuadLike} from "@opennetwork/rdf-data-model"
import {QuadFind} from "./match"
import {ReadonlyDataset} from "./readonly-dataset"
import {MutateDataset} from "./mutate-dataset"

export interface ArrayLike<T> extends Iterable<T> {
  [key: number]: T | undefined
  push(value: T): void
  length: number
}

export function mutateArray(source: ArrayLike<Iterable<Quad>> = []): MutateDataset {
  return {
    construct(source: Iterable<Quad>): MutateDataset {
      return mutateArray([source])
    },
    add(value: Quad) {
      source.push([value])
    },
    addAll(values: Iterable<Quad>) {
      source.push(values)
    },
    async import(dataset: AsyncIterable<Quad>, eager?: boolean) {
      const values = []
      for await (const quad of dataset) {
        if (eager) {
          this.add(quad)
        } else {
          values.push(quad)
        }
      }
      if (values.length) {
        this.addAll(values)
      }
    },
    delete(match: Quad | QuadLike | QuadFind) {
      for (let index = 0; index < source.length; index += 1) {
        const part = source[index]
        source[index] = new ReadonlyDataset(part).without(match).toArray()
      }
    },
    *[Symbol.iterator]() {
      for (const part of source) {
        yield* part
      }
    }
  }
}
