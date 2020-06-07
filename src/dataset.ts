import {
  isQuad,
  DefaultDataFactory,
  Quad,
  QuadLike, isQuadLike
} from "@opennetwork/rdf-data-model"
import { ReadonlyDataset } from "./readonly-dataset"
import {isQuadFind, QuadFind} from "./match"
import { SetLike } from "./set-like"

export interface Dataset extends ReadonlyDataset {

}

export interface Dataset {
  add(value: Quad | QuadLike): Dataset
  addAll(dataset: Iterable<Quad | QuadLike>): Dataset
  import(dataset: AsyncIterable<Quad | QuadLike>): Promise<unknown>
  delete(quad: Quad | QuadLike | QuadFind): Dataset
  replace(replacing: Quad | QuadLike | Iterable<Quad | QuadLike>, replacers: Quad | QuadLike | Iterable<Quad | QuadLike>): Dataset
}
export class Dataset extends ReadonlyDataset {

  readonly #set: SetLike<Quad>

  constructor(set: SetLike<Quad> = new Set()) {
    super(set)
    this.#set = set
  }

  add(value: Quad | QuadLike): Dataset {
    const quad = isQuad(value) ? value : DefaultDataFactory.fromQuad(value)
    if (this.#set.has ? this.#set.has(quad) : this.has(quad)) {
      return this
    }
    this.#set.add(quad)
    return this
  }

  addAll(dataset: Iterable<Quad | QuadLike>): Dataset {
    for (const value of dataset) {
      this.add(value)
    }
    return this
  }

  async import(dataset: AsyncIterable<Quad | QuadLike>, eager?: boolean): Promise<unknown> {
    const values: (Quad | QuadLike)[] = []
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
    this.match(quad).forEach(this.deleteSource.bind(this))
    return this
  }

  protected deleteSource(quad: Quad) {
    this.#set.delete(quad)
  }

  replace(replacing: Quad | QuadLike | Iterable<Quad | QuadLike>, replacers: Quad | QuadLike | Iterable<Quad | QuadLike>): Dataset {
    const replacingDataset = new Set(new ReadonlyDataset().union((isQuad(replacing) || isQuadLike(replacing)) ? [replacing] : replacing).filter(quad => this.has(quad)))
    if (!replacingDataset.size) {
      return
    }
    for (const toDelete of replacingDataset) {
      this.delete(toDelete)
    }
    if (isQuad(replacers) || isQuadLike(replacers)) {
      this.add(replacers)
    } else {
      this.addAll(replacers)
    }
    return this
  }

  get size() {
    return this.#set.size
  }

}
