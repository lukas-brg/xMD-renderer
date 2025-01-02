import { readFile, replaceTabs } from "./string_util";

export interface Point {
    line: number;
    column: number;
    offset: number;
}

export class MdInput {
    readonly lines: string[];
    private content: string;
    private _currentPoint: Point;
    private prevLine: string | null = null;
    constructor(content: string) {
        this.content = replaceTabs(content);
        this.lines = content.split("\n");
        this._currentPoint = { line: 0, column: 1, offset: 0 };
    }

    static fromFile(filePath: string): MdInput {
        const fileContent = readFile(filePath);
        if (!fileContent) {
            throw new Error(`File ${filePath} could not be loaded`);
        }
        return new MdInput(fileContent);
    }

    get currentPoint(): Point {
        return { ...this._currentPoint };
    }

    reset() {
        this._currentPoint = { line: 0, column: 1, offset: 0 };
    }

    previousLine(): string | null {
        const lineIdx = this._currentPoint.line - 1;

        if (lineIdx == 0) {
            return null;
        }
        return this.lines[lineIdx - 1];
    }

    currentLine(): string {
        const lineIdx = this._currentPoint.line - 1;

        if (lineIdx == -1) {
            return this.lines[0];
        }
        return this.lines[lineIdx];
    }

    nextLine(): string | null {
        const lineIdx = this._currentPoint.line;

        if (lineIdx >= this.lines.length) {
            return null;
        }
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

    currentLineSkipWhiteSpace(): [Point, string] {
        const line = this.currentLine();

        const lineTrimmed = line.trimStart();

        const whitespaceCount = line.length - lineTrimmed.length;
        const lineWithoutWhitespace = line.slice(whitespaceCount);

        let newPoint = this.currentPoint;
        newPoint.column += whitespaceCount;

        return [newPoint, lineWithoutWhitespace];
    }
}
