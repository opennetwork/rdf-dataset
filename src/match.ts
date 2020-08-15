import { QuadLike, TermLike, DefaultDataFactory, isQuad, isQuadLike, isTermLike } from "@opennetwork/rdf-data-model"

function hasKey<V = unknown, K extends (string | symbol | number) = any>(value: V, key: K): value is V & object & Record<K, unknown> {
  return (
    typeof value === "object" &&
    value.hasOwnProperty(key)
  )
}

export declare type QuadFind = Partial<QuadLike | {
  subject: TermLike
  predicate: TermLike
  object: TermLike
  graph: TermLike
}>

export function isQuadFind(value: unknown): value is QuadFind {
  return (
    isQuadLike(value) ||
    (
      hasKey(value, "subject") &&
      isTermLike(value)
    ) ||
    (
      hasKey(value, "predicate") &&
      isTermLike(value)
    ) ||
    (
      hasKey(value, "object") &&
      isTermLike(value)
    ) ||
    (
      hasKey(value, "graph") &&
      isTermLike(value)
    )
  )
}

export function isSingleMatcher(find: QuadFind): boolean {
  return !!(
    find.subject &&
    find.predicate &&
    find.object &&
    find.graph
  )
}

export function isMatch(quad: QuadLike, find: QuadFind): boolean {
  const quadInstance = isQuad(quad) ? quad : DefaultDataFactory.fromQuad(quad)
  return (
    (
      !find.subject || quadInstance.subject.equals(find.subject)
    ) &&
    (
      !find.predicate || quadInstance.predicate.equals(find.predicate)
    ) &&
    (
      !find.object || quadInstance.object.equals(find.object)
    ) &&
    (
      !find.graph || quadInstance.graph.equals(find.graph)
    )
  )
}

export interface Matcher {
  (quad: QuadLike): boolean
}

export function matcher(find: QuadFind): Matcher {
  return quad => isMatch(quad, find)
}
