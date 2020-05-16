import {
  isQuad,
  DefaultDataFactory,
  Quad,
  QuadLike
} from "@opennetwork/rdf-data-model"
import { ReadonlyDataset } from "./readonly-dataset";
import {
  QuadGraphLike,
  QuadObjectLike,
  QuadPredicateLike,
  QuadSubjectLike
} from "@opennetwork/rdf-data-model/esnext/quad";
import { QuadFind } from "./match";

export class Dataset extends ReadonlyDataset {

  readonly #set: Set<Quad>

  constructor(set: Set<Quad> = new Set()) {
    super(set)
    this.#set = set
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
    this.match(quad).forEach(quad => this.#set.delete(quad))
    return this
  }

  get size() {
    return this.#set.size
  }

}
