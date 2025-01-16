import { assert } from "console";
import {
    readFile,
    replaceTabs,
    isEmpty,
    leadingWhitespaces,
    trailingWhiteSpaces,
} from "./string_utils.js";

export interface Point {
    line: number;
    column: number;
    offset: number;
}

export class InputState {
    readonly lines: string[];
    readonly content: string;
    private _currentPoint: Point;
    private consumedLines: Set<number>;
    constructor(content: string) {
        this.content = replaceTabs(content);
        this.lines = this.content.split("\n");
        this._currentPoint = { line: 0, column: 1, offset: 0 };
        this.consumedLines = new Set();
    }

    static fromFile(filePath: string): InputState {
        const fileContent = readFile(filePath);
        if (!fileContent) {
            throw new Error(`File ${filePath} could not be loaded`);
        }
        return new InputState(fileContent);
    }

    get currentLineIndex(): number {
        return this._currentPoint.line - 1;
    }

    static fromString(content: string): InputState {
        return new InputState(content);
    }

    get currentPoint(): Point {
        return { ...this._currentPoint };
    }
    set currentPoint(p: Point) {
        this.currentPoint = p;
    }

    consumeLine(relativeIndex?: number) {
        const absIdx = this.currentPoint.line - 1 + (relativeIndex ?? 0);
        assert(!(absIdx < 0 || absIdx >= this.lines.length));
        this.consumedLines.add(absIdx);
    }

    reset() {
        this._currentPoint = { line: 0, column: 1, offset: 0 };
    }

    previousLine(): string | null {
        const lineIdx = this._currentPoint.line - 1;

        if (lineIdx < 0) {
            return null;
        }
        return this.lines[lineIdx];
    }

    currentLine(): string {
        const lineIdx = Math.max(this._currentPoint.line - 1, 0);
        return this.lines[lineIdx];
    }

    line(relativeIndex?: number): string {
        const absIdx = this.currentPoint.line - 1 + (relativeIndex ?? 0);
        assert(!(absIdx < 0 || absIdx >= this.lines.length));
        return this.lines[absIdx];
    }

    hasNext(): boolean {
        return this.currentPoint.line < this.lines.length;
    }

    nextLine(): string | null {
        const lineIdx = this._currentPoint.line;

        if (lineIdx >= this.lines.length) {
            this._currentPoint.line++;
            return null;
        }

        let dOffset = this.previousLine()?.length ?? 0;

        this._currentPoint.offset += dOffset;
        this._currentPoint.line++;
        return this.lines[lineIdx];
    }

    peekLine(): string | null {
        const lineIdx = this._currentPoint.line;

        if (lineIdx >= this.lines.length) {
            return null;
        }
        return this.lines[lineIdx];
    }

    /** Strips leading whitespaces from the current line, 
            returns the `Point` marking the stripped line's beginning 
            and the stripped line without advancing to the new Point 
    */
    lineSkipWhiteSpaces(relativeIndex?: number): [Point, string] {
        const absIdx = this.currentPoint.line - 1 + (relativeIndex ?? 0);
        assert(!(absIdx < 0 || absIdx >= this.lines.length));
        const line = this.lines[absIdx];

        const lineTrimmed = line.trimStart();

        const whitespaceCount = line.length - lineTrimmed.length;

        let newPoint = this.currentPoint;
        newPoint.column += whitespaceCount;
        newPoint.offset += whitespaceCount;

        return [newPoint, lineTrimmed];
    }

    isEmptyLine(relativeIndex?: number): boolean {
        const absIdx = this.currentPoint.line - 1 + (relativeIndex ?? 0);
        if (absIdx < 0 || absIdx >= this.lines.length) {
            return true;
        }

        return isEmpty(this.lines[absIdx]);
    }

    leadingWhitespaces(relativeIndex?: number): number {
        const absIdx = this.currentPoint.line - 1 + (relativeIndex ?? 0);
        if (absIdx < 0 || absIdx >= this.lines.length) {
            return 0;
        }

        return leadingWhitespaces(this.lines[absIdx]);
    }

    trailingWhitespaces(relativeIndex?: number): number {
        const absIdx = this.currentPoint.line - 1 + (relativeIndex ?? 0);
        if (absIdx < 0 || absIdx >= this.lines.length) {
            return 0;
        }

        return trailingWhiteSpaces(this.lines[absIdx]);
    }

    skipToFirstNonEmptyLine() {
        while (this.isEmptyLine() && this.nextLine() != null) {}
    }
}
