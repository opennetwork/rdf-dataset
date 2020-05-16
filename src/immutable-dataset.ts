import {
  isQuad,
  DefaultDataFactory,
  Quad,
  QuadLike
} from "@opennetwork/rdf-data-model"
import {
  QuadGraphLike,
  QuadObjectLike,
  QuadPredicateLike,
  QuadSubjectLike
} from "@opennetwork/rdf-data-model/esnext/quad";
import { Dataset } from "./dataset";
import { QuadFind } from "./match";

export class ImmutableDataset extends Dataset {

  readonly #set: Set<Quad>

  constructor(set: Set<Quad> = new Set()) {
    super(set)
    this.#set = set
  }

  add(value: Quad | QuadLike): ImmutableDataset {
    return this.addAll([value])
  }

  addAll(dataset: Iterable<Quad | QuadLike>): ImmutableDataset {
    return new ImmutableDataset(new Set(this.union(dataset)))
  }

  async import(dataset: AsyncIterable<Quad | QuadLike>, eager?: boolean): Promise<ImmutableDataset> {
    const next = new Set(this.#set)
    for await (const value of dataset) {
      next.add(isQuad(value) ? value : DefaultDataFactory.fromQuad(value))
    }
    return new ImmutableDataset(next)
  }

  delete(quad: Quad | QuadLike | QuadFind) {
    return new ImmutableDataset(new Set(this.without(quad)))
  }

}
