import { readFile } from "./string_util";

export interface Point {
    line: number;
    column: number;
    offset: number;
}

export class MdInput {
    content: string;
    currentPoint: Point;
    prevLine: string | null = null;
    constructor(content: string) {
        this.content = content;
        this.currentPoint = { line: 0, column: 1, offset: 0 };
    }

    static fromFile(filePath: string): MdInput {
        const fileContent = readFile(filePath);
        if (!fileContent) {
            throw new Error(`File ${filePath} could not be loaded`);
        }
        return new MdInput(fileContent);
    }

    reset() {
        this.currentPoint = { line: 0, column: 1, offset: 0 };
    }

    currentChar(): string | null {
        if (this.currentPoint.offset < this.content.length) {
            const char = this.content[this.currentPoint.offset];
            return char;
        }
        return null;
    }

    nextChar(): string | null {
        if (this.currentPoint.offset < this.content.length - 1) {
            const char = this.content[++this.currentPoint.offset];
            if (char === "\n") {
                this.currentPoint.line++;
                this.currentPoint.column = 1;
            } else {
                this.currentPoint.column++;
            }
            return char;
        }
        return null;
    }

    previousLine(): string | null {
        if (this.currentPoint.line == 1) {
            return null;
        }
        const startOfPrevLine =
            this.content.lastIndexOf(
                "\n",
                this.currentPoint.offset - this.currentPoint.column - 1,
            ) + 1;
        const endOfLine = this.content.indexOf(
            "\n",
            this.currentPoint.offset - this.currentPoint.column - 1,
        );
        return this.content.substring(
            startOfPrevLine,
            endOfLine === -1 ? undefined : endOfLine,
        );
        // return this.prevLine;
    }

    currentLine(): string {
        const startOfLine =
            this.content.lastIndexOf("\n", this.currentPoint.offset - 1) + 1;
        const endOfLine = this.content.indexOf("\n", this.currentPoint.offset);
        return this.content.substring(
            startOfLine,
            endOfLine === -1 ? undefined : endOfLine,
        );
    }

    remainingCurrentLine(): string {
        return this.content.substring(
            this.currentPoint.offset,
            this.content.indexOf("\n", this.currentPoint.offset + 1),
        );
    }

    nextLine(): string | null {
        const endOfLine = this.content.indexOf("\n", this.currentPoint.offset);
        if (endOfLine == -1) {
            return null;
        }
        const endOfNextLine = this.content.indexOf("\n", endOfLine + 1);
        if (endOfNextLine == -1) {
            return null;
        }
        this.currentPoint.column = 1;
        this.currentPoint.line++;
        this.currentPoint.offset = endOfLine + 1;
        this.prevLine = this.currentLine();
        if (this.currentPoint.line == 1) {
            this.prevLine = null;
            this.currentPoint.offset = endOfLine;
            return this.content.substring(0, endOfLine);
        }
        return this.content.substring(endOfLine + 1, endOfNextLine);
    }

    peekLine(): string | null {
        const prevPoint = { ...this.currentPoint };
        const prevLineCpy = this.prevLine;
        const nextLine = this.nextLine();
        this.currentPoint = prevPoint;
        this.prevLine = prevLineCpy;
        return nextLine;
    }
}
