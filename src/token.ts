import { Point } from "./input_state";

export type ContentKind = "block" | "inline" | "text" | "root";

/** `wrapped` is for when the content of a single line is wrapped in an opening and closing tag. ie: `<h1>Heading</h1>` 
 The goal is to make the handling of these situations easier, 
 so you don't have to create explicitly create the tokens `[<h1>, Heading, </h1>]`
*/
export type TagKind = "open" | "close" | "selfClosing" | "wrapped" | "text";

export class Token {
    tag: string;
    content?: string;
    kind: ContentKind;
    parseContent: boolean;
    depth: number = 0;
    tagKind: TagKind = "selfClosing";

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
        this.tagKind = tagKind ?? "selfClosing";
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
}

export class InlineToken extends Token {
    constructor(
        tag: string,
        position: number,
        tagKind?: TagKind,
        content?: string,
        parseContent?: boolean,
        depth?: number,
    ) {
        super(tag, "inline", content, tagKind, parseContent, depth);
    }

    static createContentless(
        tag: string,
        position: number,
        tagKind?: TagKind,
        depth?: number,
    ): InlineToken {
        return new InlineToken(tag, position, undefined, tagKind, false, depth);
    }

    static createSelfClosing(tag: string, position: number, depth?: number): InlineToken {
        return new InlineToken(tag, position, undefined, "selfClosing", false, depth);
    }

    static createWrapped(
        tag: string,
        position: number,
        content: string,
        depth?: number,
    ): InlineToken {
        return new InlineToken(tag, position, "wrapped", content, true, depth);
    }

    static createText(position: number, content: string, depth?: number): InlineToken {
        return new InlineToken("text", position, "text", content, true, depth);
    }
}
