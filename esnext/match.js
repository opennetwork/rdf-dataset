import { DefaultDataFactory, isQuad, isQuadLike, isTermLike } from "@opennetwork/rdf-data-model";
function hasKey(value, key) {
    return (typeof value === "object" &&
        value.hasOwnProperty(key));
}
export function isQuadFind(value) {
    return (isQuadLike(value) ||
        (hasKey(value, "subject") &&
            isTermLike(value)) ||
        (hasKey(value, "predicate") &&
            isTermLike(value)) ||
        (hasKey(value, "object") &&
            isTermLike(value)) ||
        (hasKey(value, "graph") &&
            isTermLike(value)));
}
export function isSingleMatcher(find) {
    return !!(find.subject &&
        find.predicate &&
        find.object &&
        find.graph);
}
export function isMatch(quad, find) {
    const quadInstance = isQuad(quad) ? quad : DefaultDataFactory.fromQuad(quad);
    return ((!find.subject || quadInstance.subject.equals(find.subject)) &&
        (!find.predicate || quadInstance.predicate.equals(find.predicate)) &&
        (!find.object || quadInstance.object.equals(find.object)) &&
        (!find.graph || quadInstance.graph.equals(find.graph)));
}
//# sourceMappingURL=match.js.map