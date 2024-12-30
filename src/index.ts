import * as fs from "fs";

console.log("World World");

function readFile(filePath: string): string | null {
    try {
        const data = fs.readFileSync(filePath, "utf-8");
        return data;
    } catch (err) {
        console.error("Error reading file:", err);
        return null;
    }
}

interface Point {
    line: number;
    column: number;
    offset: number;
}

class InputDocument {
    content: string;
    currentPoint: Point;

    constructor(content: string) {
        this.content = content;
        this.currentPoint = { line: 1, column: 1, offset: 0 };
    }

    nextChar(): string | null {
        if (this.currentPoint.offset < this.content.length) {
            const char = this.content[this.currentPoint.offset];

            if (char === "\n") {
                this.currentPoint.line++;
                this.currentPoint.column = 1;
            } else {
                this.currentPoint.offset++;
                this.currentPoint.column++;
            }
            return char;
        }
        return null;
    }

    currentLine(): string {
        const startOfLine =
            this.content.lastIndexOf("\n", this.currentPoint.offset - 1) + 1;
        const endOfLine = this.content.indexOf("\n", this.currentPoint.offset);
        return this.content.substring(
            startOfLine,
            endOfLine === -1 ? undefined : endOfLine
        );
    }

    remainingCurrentLine(): string {
        const startOfLine =
            this.content.lastIndexOf("\n", this.currentPoint.offset - 1) + 1;
        return this.content.substring(
            this.currentPoint.offset,
            this.content.indexOf("\n", this.currentPoint.offset)
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
        return this.content.substring(endOfLine + 1, endOfNextLine);
    }
}

interface TokenizingState {
    currentPoint: Point;
}

function parseFile(filePath: string) {
    let fileContent = readFile(filePath);
    if (!fileContent) {
        return;
    }
    let doc = new InputDocument(fileContent);
    console.log(doc.nextChar());
    console.log(doc.remainingCurrentLine());
    console.log(doc.currentLine());
    console.log(doc.nextLine());
    console.log(doc.nextChar());
    console.log(doc.remainingCurrentLine());
}

parseFile("test.md");
