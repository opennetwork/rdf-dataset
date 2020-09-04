import {Quad} from "@opennetwork/rdf-data-model";
import {QuadFind} from "./match";

export interface MutateDataset extends Iterable<Quad> {
  add(value: Quad): void
  addAll(dataset: Iterable<Quad>): void
  import(dataset: AsyncIterable<Quad>, eager?: boolean): Promise<void>
  delete(match: Quad | QuadFind): void
  has?(match: Quad | QuadFind): boolean
  size?: number
  construct?(source: Iterable<Quad>): MutateDataset
}
