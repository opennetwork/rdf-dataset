export interface SetLike<T> extends Iterable<T> {
  add(value: T): void
  has?(value: T): boolean
  delete(value: T): void
  size: number
  construct?(initial?: Iterable<T>): SetLike<T>
}
