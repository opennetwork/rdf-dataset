import {
  isQuad,
  DefaultDataFactory,
  Quad,
  QuadLike, isQuadLike
} from "@opennetwork/rdf-data-model"
import { Dataset } from "./dataset"
import { QuadFind } from "./match"
import { SetLike } from "./set-like"
import {ReadonlyDataset} from "./readonly-dataset";

export interface ImmutableDataset extends Dataset {

}

export interface ImmutableDataset {
  add(value: Quad | QuadLike): ImmutableDataset
  addAll(dataset: Iterable<Quad | QuadLike>): ImmutableDataset
  import(dataset: AsyncIterable<Quad | QuadLike>): Promise<ImmutableDataset>
  delete(quad: Quad | QuadLike | QuadFind): ImmutableDataset
  replace(replacing: Quad | QuadLike | QuadFind | Iterable<Quad | QuadLike | QuadFind>, replacers: Quad | QuadLike | Iterable<Quad | QuadLike>): ImmutableDataset
}

export class ImmutableDataset extends Dataset {

  readonly #set: SetLike<Quad>

  constructor(set: SetLike<Quad> = new Set()) {
    super(set)
    this.#set = set
  }

  add(value: Quad | QuadLike): ImmutableDataset {
    return this.addAll([value])
  }

  addAll(dataset: Iterable<Quad | QuadLike>): ImmutableDataset {
    return new ImmutableDataset(this.constructSet(this.union(dataset)))
  }

  async import(dataset: AsyncIterable<Quad | QuadLike>, eager?: boolean): Promise<ImmutableDataset> {
    const next = this.constructSet(this.#set)
    for await (const value of dataset) {
      next.add(isQuad(value) ? value : DefaultDataFactory.fromQuad(value))
    }
    return new ImmutableDataset(next)
  }

  delete(quad: Quad | QuadLike | QuadFind) {
    return new ImmutableDataset(this.constructSet(this.without(quad)))
  }

  replace(replacing: Quad | QuadLike | Iterable<Quad | QuadLike>, replacers: Quad | QuadLike | Iterable<Quad | QuadLike>): ImmutableDataset {
    const replacingDataset = new Set(new ReadonlyDataset().union((isQuad(replacing) || isQuadLike(replacing)) ? [replacing] : replacing).filter(quad => this.has(quad)))
    if (!replacingDataset.size) {
      // No changes, nothing to replace
      return this
    }
    return new ImmutableDataset(this.constructSet(
      this
        .except(quad => replacingDataset.has(quad))
        .union((isQuad(replacers) || isQuadLike(replacers)) ? [replacers] : replacers)
    ))
  }

  private constructSet(initial?: Iterable<Quad>) {
    if (this.#set.construct) {
      return this.#set.construct(initial)
    } else {
      return new Set(initial)
    }
  }

}
