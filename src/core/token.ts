import { textChangeRangeIsUnchanged } from "typescript";
import { Point } from "./input_state.js";
import { Dict } from "./util.js";
import { assert } from "console";
import { tracingChannel } from "diagnostics_channel";

type ContentKind = "block" | "inline" | "text" | "root" | "container";

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
    createdByRule: string;

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
        createdBy: string,
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
        this.createdByRule = createdBy;
    }

    addAttribute(key: string, value: string) {
        this.attributes.set(key, value);
    }

    addAttributes(attributes: Dict<string>) {
        for (let [key, value] of Object.entries(attributes)) {
            this.attributes.set(key, value);
        }
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
        createdBy: string,
        tagKind?: TagKind,
        content?: string,
        parseContent?: boolean,
        depth?: number,
    ) {
        super(tag, "block", createdBy, content, tagKind, parseContent, depth);
        this.relatedPosition = relatedPosition;
        this.inlineTokens = [];
    }

    static createContentless(
        tag: string,
        relatedPosition: Point,
        createdBy: string,
        tagKind?: TagKind,
        depth?: number,
    ): BlockToken {
        return new BlockToken(
            tag,
            relatedPosition,
            createdBy,
            tagKind,
            undefined,
            false,
            depth,
        );
    }

    static createSelfClosing(
        tag: string,
        relatedPosition: Point,
        createdBy: string,
        depth?: number,
    ): BlockToken {
        return new BlockToken(
            tag,
            relatedPosition,
            createdBy,
            undefined,
            "selfClosing",
            false,
            depth,
        );
    }

    static createWrapped(
        tag: string,
        relatedPosition: Point,
        createdBy: string,
        content: string,
        depth?: number,
    ): BlockToken {
        return new BlockToken(
            tag,
            relatedPosition,
            createdBy,
            "wrapped",
            content,
            true,
            depth,
        );
    }

    static createOpening(
        tag: string,
        relatedPosition: Point,
        createdBy: string,
        depth?: number,
    ) {
        return BlockToken.createContentless(
            tag,
            relatedPosition,
            createdBy,
            "open",
            depth,
        );
    }

    static createText(
        relatedPosition: Point,
        createdBy: string,
        content: string,
        depth?: number,
    ): BlockToken {
        return new BlockToken(
            "text",
            relatedPosition,
            createdBy,
            "text",
            content,
            true,
            depth,
        );
    }
    static createPreservedText(
        relatedPosition: Point,
        createdBy: string,
        content: string,
        depth?: number,
    ): BlockToken {
        return new BlockToken(
            "text",
            relatedPosition,
            createdBy,
            "text",
            content,
            false,
            depth,
        );
    }
}

export class InlineToken extends Token {
    positionStart: number;
    positionEnd: number;
    constructor(
        tag: string,
        position: number,
        createdBy: string,
        tagKind?: TagKind,
        content?: string,
        parseContent?: boolean,
        depth?: number,
        positionEnd?: number,
    ) {
        super(tag, "inline", createdBy, content, tagKind, parseContent, depth);
        this.positionStart = position;
        this.positionEnd = positionEnd ?? position + 1;
    }

    static createContentless(
        tag: string,
        position: number,
        createdBy: string,
        tagKind?: TagKind,
        positionEnd?: number,
        depth?: number,
    ): InlineToken {
        return new InlineToken(
            tag,
            position,
            createdBy,
            tagKind,
            undefined,
            false,
            depth,
            positionEnd,
        );
    }

    static createSelfClosing(
        tag: string,
        position: number,
        createdBy: string,
        depth?: number,
    ): InlineToken {
        return new InlineToken(
            tag,
            position,
            createdBy,
            undefined,
            "selfClosing",
            false,
            depth,
        );
    }

    static createWrapped(
        tag: string,
        position: number,
        createdBy: string,
        content: string,
        positionEnd?: number,
        parseContent?: boolean,
        depth?: number,
    ): InlineToken {
        return new InlineToken(
            tag,
            position,
            createdBy,
            "wrapped",
            content,
            parseContent,
            depth,
            positionEnd,
        );
    }

    static createText(
        position: number,
        createdBy: string,
        content: string,
        positionEnd?: number,
        depth?: number,
    ): InlineToken {
        return new InlineToken(
            "text",
            position,
            createdBy,
            "text",
            content,
            true,
            depth,
            positionEnd,
        );
    }
}

export class BlockTokenContainer {
    children: BlockToken[];
    tags: string[];
    relatedPosition: Point;
    createdBy: string;
    parseContent?: boolean;
    depth?: number;
    containerTokens: BlockToken[];

    constructor(
        tags: [string, ...string[]] | string,
        relatedPosition: Point,
        createdBy: string,
        parseContent?: boolean,
        depth?: number,
    ) {
        tags = typeof tags === "string" ? [tags] : tags;
        this.relatedPosition = relatedPosition;
        this.createdBy = createdBy;

        this.children = [];
        this.tags = tags;
        this.containerTokens = [];
    }

    addBlockToken(...children: BlockToken[]) {
        this.children.push(...children);
    }

    addContainerToken(token: BlockToken) {
        assert(token.tagKind === "open");
        this.containerTokens.push(token);
    }

    flatten(): BlockToken[] {
        let flattenedTokens = [];
        for (let tag of this.tags) {
            flattenedTokens.push(
                BlockToken.createContentless(
                    tag,
                    this.relatedPosition,
                    this.createdBy,
                    "open",
                ),
            );
        }

        for (let tok of this.containerTokens) {
            flattenedTokens.push(tok);
            this.tags.push(tok.tag);
        }

        const endPos =
            this.children[this.children.length - 1].relatedPosition ??
            this.relatedPosition;

        if (!this.parseContent) {
            for (let tok of this.children) {
                tok.parseContent = false;
            }
        }

        flattenedTokens.push(...this.children);

        for (let tag of this.tags.reverse()) {
            flattenedTokens.push(
                BlockToken.createContentless(tag, endPos, this.createdBy, "close"),
            );
        }
        return flattenedTokens;
    }
}
