import {Quad} from "@opennetwork/rdf-data-model"
import {isMatch, QuadFind, withoutMatched} from "./match"
import {MutateDataset} from "./mutate-dataset"
import {ReadonlyDataset} from "./readonly-dataset";

export interface ArrayLike<T> extends Iterable<T> {
  [key: number]: T | undefined
  push(value: T): void
  length: number
}

export function mutateArray(source: ArrayLike<Iterable<Quad>> = []): MutateDataset {
  let writeForwardWorking: Quad[] | undefined = undefined,
    deletable: Quad[] | undefined = undefined
  return {
    construct(source: Iterable<Quad>): MutateDataset {
      return mutateArray([source])
    },
    add(value: Quad) {
      if (deletable) {
        deletable.push(value)
      } else  {
        if (!writeForwardWorking) {
          writeForwardWorking = []
          source.push(writeForwardWorking)
        }
        source.push([value])
      }
    },
    addAll(values: Iterable<Quad>) {
      if (deletable) {
        deletable.push(...values)
      } else {
        writeForwardWorking = undefined
        source.push(values)
      }
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
    deleteMatches(match) {
      const [deleted] = collect()
      deletable = [
        ...new ReadonlyDataset(this).without(match)
      ]
      return deleted
    },
    delete(match: Quad) {
      const [deleted, doCollection] = collect()
      deletable = [
        ...withoutMatched(this, match, false, doCollection)
      ]
      return deleted
    },
    *[Symbol.iterator]() {
      if (deletable) {
        yield* deletable
      } else {
        for (const part of source) {
          yield* part
        }
      }
    }
  }

  function collect(): [Quad[], (quad: Quad) => void] {
    const collected: Quad[] = []
    function doCollection(quad: Quad) {
      collected.push(quad)
    }
    return [collected, doCollection]
  }
}
