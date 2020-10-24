import {Quad} from "@opennetwork/rdf-data-model"

export interface MutateDataset extends Iterable<Quad> {
  add(value: Quad): void
  addAll(dataset: Iterable<Quad>): void
  import(dataset: AsyncIterable<Quad>, eager?: boolean): Promise<void>
  delete(match: Quad): void
  has?(match: Quad): boolean
  size?: number
  construct?(source: Iterable<Quad>): MutateDataset
}
