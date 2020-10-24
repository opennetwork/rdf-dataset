import {DatasetWatcher} from "./watcher"
import {PartitionFilterFn} from "./partition-filter"
import {MutateDataset} from "./mutate-dataset"

export interface DatasetOptions {
  mutate: MutateDataset
  match?: PartitionFilterFn
  watch?: DatasetWatcher
}
