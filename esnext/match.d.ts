import { QuadLike, TermLike } from "@opennetwork/rdf-data-model";
export declare type QuadFind = Partial<QuadLike | {
    subject: TermLike;
    predicate: TermLike;
    object: TermLike;
    graph: TermLike;
}>;
export declare function isQuadFind(value: unknown): value is QuadFind;
export declare function isSingleMatcher(find: QuadFind): boolean;
export declare function isMatch(quad: QuadLike, find: QuadFind): boolean;
