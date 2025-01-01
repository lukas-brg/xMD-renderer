import * as fs from "fs";

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

class MdInput {
    content: string;
    currentPoint: Point;

    constructor(content: string) {
        this.content = content;
        this.currentPoint = { line: 1, column: 1, offset: 0 };
    }

    reset() {
        this.currentPoint = { line: 1, column: 1, offset: 0 };
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
                this.currentPoint.offset - this.currentPoint.column - 1
            ) + 1;
        const endOfLine = this.content.indexOf(
            "\n",
            this.currentPoint.offset - this.currentPoint.column - 1
        );
        return this.content.substring(
            startOfPrevLine,
            endOfLine === -1 ? undefined : endOfLine
        );
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
        return this.content.substring(
            this.currentPoint.offset,
            this.content.indexOf("\n", this.currentPoint.offset + 1)
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

interface Compiler {}

enum ContentKind {
    BLOCK,
    INLINE,
    TEXT,
    ROOT,
}

class Token {
    tag: string;
    relatedPosition: Point;
    content?: string;
    kind: ContentKind;
    parseContent: boolean;

    constructor(
        tag: string,
        relatedPosition: Point,
        kind: ContentKind,
        content?: string,
        parseContent?: boolean
    ) {
        this.tag = tag;
        this.relatedPosition = relatedPosition;
        this.content = content;
        this.kind = kind;
        this.parseContent = parseContent ?? true;
    }
}

class BlockToken extends Token {
    constructor(tag: string, content: string, relatedPosition: Point) {
        super(tag, relatedPosition, ContentKind.BLOCK, content);
    }
}

function isEmpty(line: string): boolean {
    return /^\s*$/.test(line);
}

interface BlockRule {
    process: (input: MdInput) => boolean;
    before?: (input: MdInput) => void;
    after?: (input: MdInput) => void;
}

class Heading implements BlockRule {
    static headingTypes: { [key: string]: string } = {
        "#": "h1",
        "##": "h2",
        "###": "h3",
        "####": "h4",
        "#####": "h5",
        "######": "h6",
    };

    process = (input: MdInput) => {
        const prevLine = input.previousLine();
        if (prevLine != null && !isEmpty(prevLine)) {
            return false;
        }
        const line = input.currentLine();
        const [heading, remainingLine] = line.split("/\s+/g", 1);
        const headingTag = Heading.headingTypes[heading];

        if (!headingTag) return false;
        return true;
    };
}

function parse(doc: MdInput) {
    let line;
    let tokens = new Array<Token>();

    while ((line = doc.nextLine())) {
        if (line.startsWith("# ")) {
            tokens.push(
                new BlockToken("h1", line.substring(2), doc.currentPoint)
            );
        }
    }
}

function renderFile(filePath: string) {
    let fileContent = readFile(filePath);
    if (!fileContent) {
        return;
    }
    let doc = new MdInput(fileContent);
    parse(doc);
    // console.log(doc.currentChar());
    // console.log(doc.nextChar());
    // console.log(doc.nextChar());
    // console.log(doc.remainingCurrentLine());
    // console.log(doc.currentLine());
    // console.log(doc.nextLine());
    // console.log(doc.previousLine());
    // console.log(doc.remainingCurrentLine());
}

renderFile("test.md");
