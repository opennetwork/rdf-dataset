import {ReadonlyDatasetChange} from "./readonly-dataset"
import {Quad} from "@opennetwork/rdf-data-model"
import {PartitionFilterFn} from "./partition-filter"

export interface DatasetWatcher extends AsyncIterable<ReadonlyDatasetChange> {
  add(quad: Quad): void
  addAll(quads: Iterable<Quad>): void
  delete(quad: Quad): void
  partition?(match: PartitionFilterFn): DatasetWatcher
}
