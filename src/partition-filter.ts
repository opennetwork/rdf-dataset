import {FilterIterateeFn} from "./readonly-dataset"
import {Quad, QuadLike} from "@opennetwork/rdf-data-model"
import {QuadFind} from "./match"

export interface PartitionFilterFn extends FilterIterateeFn<Quad | QuadLike | QuadFind> {

}
