export interface ArrayLike<T> {
  push(value: T): void;
  splice(index: number, deleteCount: number): void
  indexOf(value: T): number | -1
  length: number | 0
  [Symbol.iterator](): Iterable<T>
}
