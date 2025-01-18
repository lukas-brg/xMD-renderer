import { assert } from "console";
import {
    readFile,
    replaceTabs,
    isEmpty,
    leadingWhitespaces,
    trailingWhiteSpaces,
} from "./string_utils.js";
import { Range } from "./util.js";

export interface Point {
    line: number;
    column: number;
    offset: number;
}

export class InputState {
    readonly lines: string[];
    readonly content: string;
    private _currentPoint: Point;
    readonly fragmentOffset;
    readonly isWhitespace: boolean;
    readonly isEmpty: boolean;

    constructor(content: string, lineOffset: number = 0) {
        this.content = replaceTabs(content);
        this.lines = this.content.split("\n");
        this._currentPoint = { line: 0, column: 1, offset: 0 };
        this.fragmentOffset = lineOffset;
        this.isEmpty = content === "";
        this.isWhitespace = this.isEmpty || isEmpty(content);
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

    static fromString(content: string, lineOffset: number = 0): InputState {
        return new InputState(content, lineOffset);
    }

    get currentPoint(): Point {
        return { ...this._currentPoint };
    }
    set currentPoint(p: Point) {
        this.currentPoint = p;
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
        const lineIdx = Math.max(this._currentPoint.line - 1, 0) - this.fragmentOffset;
        return this.lines[lineIdx];
    }

    line(relativeIndex?: number): string {
        const absIdx =
            this.currentPoint.line - 1 + (relativeIndex ?? 0) - this.fragmentOffset;
        assert(!(absIdx < 0 || absIdx >= this.lines.length));
        return this.lines[absIdx];
    }

    isAtEof(): boolean {
        return this.currentPoint.line - this.fragmentOffset > this.lines.length;
    }

    hasNext(): boolean {
        return this.currentPoint.line - this.fragmentOffset < this.lines.length;
    }

    nextLine(): string | null {
        const lineIdx = this._currentPoint.line - this.fragmentOffset;

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
        const lineIdx = this._currentPoint.line - this.fragmentOffset;

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
        const absIdx =
            this.currentPoint.line - 1 + (relativeIndex ?? 0) - this.fragmentOffset;

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
        const absIdx =
            this.currentPoint.line - 1 + (relativeIndex ?? 0) - this.fragmentOffset;
        if (absIdx < 0 || absIdx >= this.lines.length) {
            return true;
        }

        return isEmpty(this.lines[absIdx]);
    }

    leadingWhitespaces(relativeIndex?: number): number {
        const absIdx =
            this.currentPoint.line - 1 + (relativeIndex ?? 0) - this.fragmentOffset;
        if (absIdx < 0 || absIdx >= this.lines.length) {
            return 0;
        }

        return leadingWhitespaces(this.lines[absIdx]);
    }

    trailingWhitespaces(relativeIndex?: number): number {
        const absIdx =
            this.currentPoint.line - 1 + (relativeIndex ?? 0) - this.fragmentOffset;
        if (absIdx < 0 || absIdx >= this.lines.length) {
            return 0;
        }

        return trailingWhiteSpaces(this.lines[absIdx]);
    }

    slice(start: number, end: number): string {
        return this.lines
            .slice(start - this.fragmentOffset, end - this.fragmentOffset + 1)
            .join("\n");
    }

    skipToFirstNonEmptyLine(): string | null {
        let line: string | null = this.currentLine();
        while (this.isEmptyLine()) {
            if ((line = this.nextLine()) == null) break;
        }

        return line;
    }
}
