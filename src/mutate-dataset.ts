import {Quad, QuadLike} from "@opennetwork/rdf-data-model"
import {QuadFind} from "./match"

export interface MutateDataset extends Iterable<Quad> {
  add(value: Quad): void
  addAll(dataset: Iterable<Quad>): void
  import(dataset: AsyncIterable<Quad>, eager?: boolean): Promise<void>
  delete(match: Quad): Iterable<Quad>
  deleteMatches?(match: Quad | QuadLike | QuadFind): Iterable<Quad>
  deleteAll?(matches: Iterable<Quad>): Iterable<Quad>
  has?(match: Quad): boolean
  size?: number
  construct?(source: Iterable<Quad>): MutateDataset
}
