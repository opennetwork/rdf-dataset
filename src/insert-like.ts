import { SetLike } from "./set-like";

export interface InsertLike<T> extends Iterable<T> {
  push(values: T[]): void
  delete(index: number, length: number): void
  get(index: number): T
  indexOf?(value: T): number
  length: number
}

export function getSetLikeFromInsertLike<T, R>(insert: InsertLike<T>, toFn: (value: T) => R, fromFn: (value: R) => T, equals: (left: T, right: T) => boolean): SetLike<R> {
  function getIndex(match: T): number {
    if (insert.indexOf) {
      return insert.indexOf(match)
    }
    let index = -1
    for (const value of insert) {
      index += 1
      if (equals(value, match)) {
        return index
      }
    }
    return -1
  }
  return {
    get size() {
      return insert.length
    },
    has(value: R) {
      return getIndex(fromFn(value)) > -1
    },
    add(value: R) {
      insert.push([fromFn(value)])
    },
    delete(value: R) {
      const index = getIndex(fromFn(value))
      if (index === -1) {
        return
      }
      insert.delete(index, 1)
    },
    *[Symbol.iterator]() {
      for (const value of insert) {
        yield toFn(value)
      }
    }
  }
}
