import {ReadonlyDataset, ReadonlyDatasetChange} from "./readonly-dataset"
import {Quad} from "@opennetwork/rdf-data-model"
import {PartitionFilterFn} from "./partition-filter"
import {Collector as CollectorImpl} from "microtask-collector";

export interface DatasetWatcher extends AsyncIterable<ReadonlyDatasetChange> {
  add(quad: Quad): void
  addAll(quads: Iterable<Quad>): void
  delete(quad: Quad): void
  deleteAll(quad: Iterable<Quad>): void
  partition?(match: PartitionFilterFn): DatasetWatcher
  unpartition?(match: PartitionFilterFn): void
  close?(): void
}

interface ChangeEvent {
  type: "add" | "delete"
  quad?: Quad
  quads?: Iterable<Quad>
}

export function mapReadonlyDatasetChange(events: Iterable<ChangeEvent>, meta: unknown = undefined): ReadonlyDatasetChange {
  return [
    new ReadonlyDataset({
      [Symbol.iterator]: adds
    }),
    new ReadonlyDataset({
      [Symbol.iterator]: deletes
    }),
    meta
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

export interface Collector extends AsyncIterable<ChangeEvent[]> {
  add(value: ChangeEvent): void;
  close?(): void;
}

export interface DatasetWatcherOptions {
  collector?: Collector;
}

export class DatasetWatcher implements DatasetWatcher {

  readonly #collector: Collector

  constructor(options: DatasetWatcherOptions = {}) {
    this.#collector = options.collector || new CollectorImpl();
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

  deleteAll(quads: Iterable<Quad>) {
    this.#collector.add({
      type: "delete",
      quads
    })
  }

  close?() {
    return this.#collector.close?.();
  }

  async *[Symbol.asyncIterator]() {
    for await (const set of this.#collector) {
      yield mapReadonlyDatasetChange(set);
    }
  }
}
