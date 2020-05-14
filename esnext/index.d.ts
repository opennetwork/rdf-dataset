import { AsyncIterableLike } from "@opennetwork/lazy-set";
import { Quad, QuadLike } from "@opennetwork/rdf-data-model";
export declare function dataset(sequence: Iterable<Quad | QuadLike>): import("@opennetwork/lazy-set/esnext/lazy-set").LazySet<Quad, QuadLike | Quad, Partial<QuadLike> | Partial<{
    subject: Pick<import("@opennetwork/rdf-data-model").Term<string, string>, "termType" | "value">;
    predicate: Pick<import("@opennetwork/rdf-data-model").Term<string, string>, "termType" | "value">;
    object: Pick<import("@opennetwork/rdf-data-model").Term<string, string>, "termType" | "value">;
    graph: Pick<import("@opennetwork/rdf-data-model").Term<string, string>, "termType" | "value">;
}>>;
export declare function asyncDataset(sequence: AsyncIterableLike<Quad | QuadLike>): import("@opennetwork/lazy-set/esnext/lazy-set").AsyncLazySet<Quad, QuadLike | Quad, Partial<QuadLike> | Partial<{
    subject: Pick<import("@opennetwork/rdf-data-model").Term<string, string>, "termType" | "value">;
    predicate: Pick<import("@opennetwork/rdf-data-model").Term<string, string>, "termType" | "value">;
    object: Pick<import("@opennetwork/rdf-data-model").Term<string, string>, "termType" | "value">;
    graph: Pick<import("@opennetwork/rdf-data-model").Term<string, string>, "termType" | "value">;
}>>;
