export type Dict<T> = { [key: string]: T };

/** Iterates over all non overlapping neighboring pairs in an Array */
export function* pairs<T>(arr: T[]): Generator<[T, T]> {
    for (let i = 0; i < arr.length - 1; i += 2) {
        yield [arr[i], arr[i + 1]];
    }
}
