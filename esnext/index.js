import { lazySetFactory } from "@opennetwork/lazy-set";
import { isMatch, isQuadFind } from "./match.js";
import { isQuad, isQuadLike, DefaultDataFactory } from "@opennetwork/rdf-data-model";
const quadDatasetFactoryOptions = {
    isMatch,
    isFind: isQuadFind,
    is: isQuad,
    isCreate: isQuadLike,
    create: DefaultDataFactory.fromQuad
};
const factory = lazySetFactory(quadDatasetFactoryOptions);
export function dataset(sequence) {
    return factory.lazySet(sequence);
}
export function asyncDataset(sequence) {
    return factory.asyncLazySet(sequence);
}
//# sourceMappingURL=index.js.map