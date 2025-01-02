export enum ContentKind {
    BLOCK,
    INLINE,
    TEXT,
    ROOT,
}

export class Token {
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

export class BlockToken extends Token {
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
