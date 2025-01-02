import { throws } from "assert";
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
    prevLine: string | null = null;
    constructor(content: string) {
        this.content = content;
        this.currentPoint = { line: 0, column: 1, offset: 0 };
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
        // return this.prevLine;
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
        this.prevLine = this.currentLine();
        if (this.currentPoint.line == 1) {
            this.prevLine = null;
            this.currentPoint.offset = endOfLine;
            return this.content.substring(0, endOfLine);
        }
        return this.content.substring(endOfLine + 1, endOfNextLine);
    }
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
    depth: number = 0;

    constructor(
        tag: string,
        relatedPosition: Point,
        kind: ContentKind,
        content?: string,
        parseContent?: boolean,
        depth?: number
    ) {
        this.tag = tag;
        this.relatedPosition = relatedPosition;
        this.content = content;
        this.kind = kind;
        this.parseContent = parseContent ?? true;
        this.depth = depth ?? 0;
    }
}

class BlockToken extends Token {
    constructor(
        tag: string,
        content: string,
        relatedPosition: Point,
        parseContent?: boolean,
        depth?: number
    ) {
        super(
            tag,
            relatedPosition,
            ContentKind.BLOCK,
            content,
            parseContent,
            depth
        );
    }
}

function isEmpty(line: string): boolean {
    return /^\s*$/.test(line);
}

interface BlockRule {
    process: (input: MdInput, state: ParsingState) => boolean;
    before?: (input: MdInput) => void;
    after?: (input: MdInput) => void;
}

class ParsingState {
    tokens: Array<Token>;

    constructor() {
        this.tokens = new Array<Token>();
    }

    addBlockToken(token: Token) {
        this.tokens.push(token);
    }
}

const Heading: BlockRule = {
    process: (input: MdInput, state: ParsingState) => {
        const headingTypes: { [key: string]: string } = {
            "#": "h1",
            "##": "h2",
            "###": "h3",
            "####": "h4",
            "#####": "h5",
            "######": "h6",
        };
        const prevLine = input.previousLine();
        if (prevLine != null && !isEmpty(prevLine)) {
            return false;
        }
        const line = input.currentLine();
        const [heading, remainingLine] = line.split(/\s+/, 2);
        const headingTag = headingTypes[heading];

        if (!headingTag) return false;
        state.addBlockToken(
            new BlockToken(headingTag, remainingLine, input.currentPoint)
        );

        return true;
    },
};

function parse(doc: MdInput, rules: Array<BlockRule>) {
    let line;
    let state = new ParsingState();

    while ((line = doc.nextLine()) != null) {
        for (let rule of rules) {
            rule.process(doc, state);
        }
    }
    console.log(state.tokens);
}

function renderFile(filePath: string) {
    let fileContent = readFile(filePath);
    let rules = new Array<BlockRule>();
    rules.push(Heading);
    if (!fileContent) {
        return;
    }
    let doc = new MdInput(fileContent);
    parse(doc, rules);
}

renderFile("test.md");
