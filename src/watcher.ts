import {ReadonlyDataset, ReadonlyDatasetChange} from "./readonly-dataset"
import {Quad} from "@opennetwork/rdf-data-model"
import {PartitionFilterFn} from "./partition-filter"
import {Collector, CollectorOptions} from "./collector";

export interface DatasetWatcher extends AsyncIterable<ReadonlyDatasetChange> {
  add(quad: Quad): void
  addAll(quads: Iterable<Quad>): void
  delete(quad: Quad): void
  partition?(match: PartitionFilterFn): DatasetWatcher
  unpartition?(match: PartitionFilterFn): void
  close?(): void
}

interface ChangeEvent {
  type: "add" | "delete"
  quad?: Quad
  quads?: Iterable<Quad>
}

function mapChanges(events: Iterable<ChangeEvent>): ReadonlyDatasetChange {
  return [
    new ReadonlyDataset({
      [Symbol.iterator]: adds
    }),
    new ReadonlyDataset({
      [Symbol.iterator]: deletes
    }),
    undefined
  ]

  function *adds() {
    for (const event of events) {
      if (event.type === "add") {
        yield *iterateEventValue(event)
      }
    }
  }

  function *deletes()  {
    for (const event of events) {
      if (event.type === "delete") {
        yield *iterateEventValue(event)
      }
    }
  }

  function *iterateEventValue(event: ChangeEvent): Iterable<Quad> {
    if (event.quad) {
      yield event.quad
    } else if (event.quads) {
      yield *event.quads
    }
  }
}

export class DatasetWatcher implements DatasetWatcher {

  readonly #collector: Collector<ChangeEvent, ReadonlyDatasetChange>

  constructor(options: Partial<CollectorOptions<ChangeEvent, ReadonlyDatasetChange>>) {
    this.#collector = new Collector({
      map: mapChanges,
      ...options
    })
    this[Symbol.asyncIterator] = this.#collector[Symbol.asyncIterator].bind(this.#collector)
  }

  add(quad: Quad) {
    this.#collector.add({
      type: "add",
      quad
    })
  }

  addAll(quads: Iterable<Quad>) {
    this.#collector.add({
      type: "add",
      quads
    })
  }

  delete(quad: Quad) {
    this.#collector.add({
      type: "delete",
      quad
    })
  }

  close?() {
    this.#collector.close()
  }
}
