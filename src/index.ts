import { lazySetFactory, LazySetContext, AsyncIterableLike } from "@opennetwork/lazy-set";
import { isMatch, isQuadFind, QuadFind } from "./match";
import { isQuad, isQuadLike, DefaultDataFactory, Quad, QuadLike } from "@opennetwork/rdf-data-model";

const quadDatasetFactoryOptions: LazySetContext<Quad, QuadLike | Quad, QuadFind> = {
  isMatch,
  isFind: isQuadFind,
  is: isQuad,
  isCreate: isQuadLike,
  create: DefaultDataFactory.fromQuad
};

const factory = lazySetFactory(quadDatasetFactoryOptions);

export function dataset(sequence: Iterable<Quad | QuadLike>) {
  return factory.lazySet(sequence);
}

export function asyncDataset(sequence: AsyncIterableLike<Quad | QuadLike>) {
  return factory.asyncLazySet(sequence);
}

