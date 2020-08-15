import {
  isQuad,
  DefaultDataFactory,
  Quad,
  QuadLike
} from "@opennetwork/rdf-data-model"
import { ReadonlyDataset } from "./readonly-dataset"
import { QuadFind } from "./match"
import { SetLike } from "./set-like"

export interface Dataset extends ReadonlyDataset<Quad> {

}

export interface Dataset {
  add(value: Quad | QuadLike): Dataset
  addAll(dataset: Iterable<Quad | QuadLike>): Dataset
  import(dataset: AsyncIterable<Quad | QuadLike>, eager?: boolean): Promise<unknown>
  delete(quad: Quad | QuadLike | QuadFind): Dataset
}

export class Dataset extends ReadonlyDataset {

  readonly #set: SetLike<Quad>

  constructor(set: SetLike<Quad> = new Set()) {
    super(set)
    this.#set = set
  }

  has(find: Quad | QuadFind): boolean {
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
    this.#set.add(quad)
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
    this.match(quad).forEach(this.deleteSource.bind(this))
    return this
  }

  protected deleteSource(quad: Quad) {
    this.#set.delete(quad)
  }

  get size() {
    return this.#set.size
  }

}
