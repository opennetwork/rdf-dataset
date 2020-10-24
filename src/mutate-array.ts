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
  let working: Quad[] | undefined = undefined
  return {
    construct(source: Iterable<Quad>): MutateDataset {
      return mutateArray([source])
    },
    add(value: Quad) {
      if (!working) {
        working = []
        source.push(working)
      }
      source.push([value])
    },
    addAll(values: Iterable<Quad>) {
      working = undefined
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
      working = undefined
      for (let index = 0; index < source.length; index += 1) {
        const part = source[index]
        const matched = new ReadonlyDataset(part).without(match)
        // This will go through the entire part to ensure it doesn't include
        // this matcher, if there is at least one value, we will start again and turn the matched into an array
        // which will set the change "in stone"
        if (!matched.empty) {
          source[index] = matched.toArray()
        }
      }
    },
    *[Symbol.iterator]() {
      for (const part of source) {
        yield* part
      }
    }
  }
}
