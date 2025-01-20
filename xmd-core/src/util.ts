import { assert } from "console";

export type Dict<T> = { [key: string]: T };

/** Iterates over all non overlapping neighboring pairs in an Array */
export function* pairs<T>(arr: T[]): Generator<[T, T]> {
    for (let i = 0; i < arr.length - 1; i += 2) {
        yield [arr[i], arr[i + 1]];
    }
}

export class Range {
    constructor(
        public start: number,
        public end: number,
    ) {
        assert(this.end >= this.start);
    }

    get size(): number {
        return this.end - this.start;
    }

    createWithSize(size: number): Range {
        return new Range(this.start, this.start + size);
    }

    contains(position: number): boolean {
        return position >= this.start && position <= this.end;
    }

    containsOpen(position: number): boolean {
        return position >= this.start;
    }

    isBefore(position: number): boolean {
        return position > this.end;
    }

    isContainedBy(other: Range): boolean {
        return this.start >= other.start && this.end <= other.end;
    }

    equals(other: Range): boolean {
        return this.start == other.start && this.end == other.end;
    }

    expand(other: Range): Range {
        const newStart = Math.min(this.start, other.start);
        const newEnd = Math.max(this.end, other.end);
        return new Range(newStart, newEnd);
    }

    adjust(offset: number): Range {
        return new Range(this.start + offset, this.end + offset);
    }

    overlaps(other: Range): boolean {
        return this.start <= other.end && this.end >= other.start;
    }

    static merge(range1: Range, range2: Range): Range | null {
        if (range1.overlaps(range2)) {
            return new Range(
                Math.min(range1.start, range2.start),
                Math.max(range1.end, range2.end),
            );
        }
        return null;
    }

    toString(): string {
        return `[${this.start}, ${this.end}]`;
    }
}

export class MultiMap<K, V> {
    private map = new Map<K, V[]>();

    add(key: K, ...value: V[]): void {
        if (!this.map.has(key)) {
            this.map.set(key, [...value]);
        } else {
            this.map.get(key)!.push(...value);
        }
    }

    get(key: K): V[] {
        if (!this.map.has(key)) return [];
        return this.map.get(key)!;
    }

    remove(key: K, value: V): boolean {
        const values = this.map.get(key);
        if (!values) return false;

        const index = values.indexOf(value);
        if (index !== -1) {
            values.splice(index, 1);
            if (values.length === 0) {
                this.map.delete(key);
            }
            return true;
        }
        return false;
    }

    entries(): MapIterator<[K, V[]]> {
        return this.map.entries();
    }
}
