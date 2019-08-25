import { dataFactory, asyncDataFactory } from "@opennetwork/dataset";
import { isMatch } from "./match";
import { isQuad, isQuadLike, DefaultDataFactory } from "@opennetwork/rdf-data-model";

const quadDatasetFactoryOptions = {
  isMatch,
  is: isQuad,
  isLike: isQuadLike,
  create: DefaultDataFactory.fromQuad
};

export const DatasetFactory = dataFactory(quadDatasetFactoryOptions);
export const AsyncDatasetFactory = asyncDataFactory(quadDatasetFactoryOptions);

