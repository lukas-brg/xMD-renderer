import { Point } from "./input_state.js";
import { Dict } from "./util.js";

export type ContentKind = "block" | "inline" | "text" | "root";

/** `wrapped` is for when the content of a single line is wrapped in an opening and closing tag. ie: `<h1>Heading</h1>` 
 The goal is to make the handling of these situations easier, 
 so you don't have to create explicitly create the tokens `[<h1>, Heading, </h1>]`
*/
export type TagKind =
    | "open"
    | "close"
    | "selfClosing"
    | "wrapped"
    | "text"
    | "preservedText";

export class Token {
    tag: string;
    content?: string;
    kind: ContentKind;
    parseContent: boolean;
    depth: number = 0;
    tagKind: TagKind = "selfClosing";
    attributes: Map<string, string>;

    /**
     * An annotation can be used to specify the context or role of the token.
     * It can be checked against at later points
     *
     * It has no effect on the generated output
     */
    annotation: string = "";

    constructor(
        tag: string,
        kind: ContentKind,
        content?: string,
        tagKind?: TagKind,
        parseContent?: boolean,
        depth?: number,
    ) {
        this.tag = tag;
        this.content = content;
        this.kind = kind;
        this.parseContent = parseContent ?? true;
        this.depth = depth ?? 0;
        this.attributes = new Map();
        this.tagKind = tagKind ?? "selfClosing";
    }

    addAttribute(key: string, value: string) {
        this.attributes.set(key, value);
    }

    withAttribute(key: string, value: string): this {
        this.attributes.set(key, value);
        return this;
    }

    withAttributes(attributes: Dict<string>): this {
        for (let [key, value] of Object.entries(attributes)) {
            this.attributes.set(key, value);
        }
        return this;
    }

    /**
     * An annotation can be used to specify the context or role of the token.
     * It can be checked against at later points
     *
     * It has no effect on the generated output
     */
    withAnnotation(annotation: string): this {
        this.annotation = annotation;
        return this;
    }
}

export class BlockToken extends Token {
    inlineTokens: InlineToken[];
    relatedPosition: Point;

    constructor(
        tag: string,
        relatedPosition: Point,
        tagKind?: TagKind,
        content?: string,
        parseContent?: boolean,
        depth?: number,
    ) {
        let point;
        super(tag, "block", content, tagKind, parseContent, depth);
        this.relatedPosition = relatedPosition;
        this.inlineTokens = [];
    }

    static createContentless(
        tag: string,
        relatedPosition: Point,
        tagKind?: TagKind,
        depth?: number,
    ): BlockToken {
        return new BlockToken(tag, relatedPosition, tagKind, undefined, false, depth);
    }

    static createSelfClosing(
        tag: string,
        relatedPosition: Point,
        depth?: number,
    ): BlockToken {
        return new BlockToken(
            tag,
            relatedPosition,
            undefined,
            "selfClosing",
            false,
            depth,
        );
    }

    static createWrapped(
        tag: string,
        relatedPosition: Point,
        content: string,
        depth?: number,
    ): BlockToken {
        return new BlockToken(tag, relatedPosition, "wrapped", content, true, depth);
    }

    static createText(
        relatedPosition: Point,
        content: string,
        depth?: number,
    ): BlockToken {
        return new BlockToken("text", relatedPosition, "text", content, true, depth);
    }
    static createPreservedText(
        relatedPosition: Point,
        content: string,
        depth?: number,
    ): BlockToken {
        return new BlockToken("text", relatedPosition, "text", content, false, depth);
    }
}

export class InlineToken extends Token {
    positionStart: number;
    positionEnd: number;
    constructor(
        tag: string,
        position: number,
        tagKind?: TagKind,
        content?: string,
        parseContent?: boolean,
        depth?: number,
        positionEnd?: number,
    ) {
        super(tag, "inline", content, tagKind, parseContent, depth);
        this.positionStart = position;
        this.positionEnd = positionEnd ?? position + 1;
    }

    static createContentless(
        tag: string,
        position: number,
        tagKind?: TagKind,
        positionEnd?: number,
        depth?: number,
    ): InlineToken {
        return new InlineToken(
            tag,
            position,
            tagKind,
            undefined,
            false,
            depth,
            positionEnd,
        );
    }

    static createSelfClosing(tag: string, position: number, depth?: number): InlineToken {
        return new InlineToken(tag, position, undefined, "selfClosing", false, depth);
    }

    static createWrapped(
        tag: string,
        position: number,
        content: string,
        positionEnd?: number,
        parseContent?: boolean,
        depth?: number,
    ): InlineToken {
        return new InlineToken(
            tag,
            position,
            "wrapped",
            content,
            parseContent,
            depth,
            positionEnd,
        );
    }

    static createText(
        position: number,
        content: string,
        positionEnd?: number,
        depth?: number,
    ): InlineToken {
        return new InlineToken(
            "text",
            position,
            "text",
            content,
            true,
            depth,
            positionEnd,
        );
    }
}
