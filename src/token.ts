import { Point } from "./mdinput";

export type ContentKind = "block" | "inline" | "text" | "root";

/** `wrapped` is for when the content of a single line is wrapped in an opening and closing tag. ie: `<h1>Heading</h1>` 
 The goal is to make the handling of these situations easier, 
 so you don't have to create explicitly create the tokens `[<h1>, Heading, </h1>]`
*/
export type TagKind = "open" | "close" | "selfClosing" | "wrapped";

export class Token {
    tag: string;
    relatedPosition: Point;
    content?: string;
    kind: ContentKind;
    parseContent: boolean;
    depth: number = 0;
    tagKind: TagKind = "selfClosing";

    constructor(
        tag: string,
        relatedPosition: Point,
        kind: ContentKind,
        content?: string,
        tagKind?: TagKind,
        parseContent?: boolean,
        depth?: number,
    ) {
        this.tag = tag;
        this.relatedPosition = relatedPosition;
        this.content = content;
        this.kind = kind;
        this.parseContent = parseContent ?? true;
        this.depth = depth ?? 0;
        this.tagKind = tagKind ?? "selfClosing";
    }
}

export class BlockToken extends Token {
    constructor(
        tag: string,
        relatedPosition: Point,
        content?: string,
        tagKind?: TagKind,
        parseContent?: boolean,
        depth?: number,
    ) {
        super(tag, relatedPosition, "block", content, tagKind, parseContent, depth);
    }

    static createContentless(
        tag: string,
        relatedPosition: Point,
        tagKind?: TagKind,
        depth?: number,
    ): BlockToken {
        return new BlockToken(tag, relatedPosition, undefined, tagKind, false, depth);
    }

    static createWrapped(
        tag: string,
        relatedPosition: Point,
        content: string,
        depth?: number,
    ): BlockToken {
        return new BlockToken(tag, relatedPosition, content, "wrapped", true, depth);
    }
}
