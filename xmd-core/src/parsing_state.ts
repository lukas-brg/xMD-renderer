import { Point, InputState } from "./input_state.js";
import { BlockToken, BlockTokenContainer, InlineToken, Token } from "./token.js";

import { DocumentState, IDocumentState } from "./document_state.js";
import { Range } from "./util.js";

type Labels = {
    footnotes: string[];
    refs: string[];
};

export type ParsedBlockData = {
    id: string;
    range: Range;
    tokens: BlockToken[];
    createdBy: string;
    annotation?: string;
    text: string;
} & Labels;

export type ParsedBlock = ParsedBlockData & {
    equals: (other: ParsedBlock) => boolean;
};

const ParsedBlockPrototype = {
    equals(this: ParsedBlock, other: ParsedBlock): boolean {
        return this.text === other.text && this.range.equals(other.range);
    },
};

export function createParsedBlock(data: ParsedBlockData): ParsedBlock {
    return Object.assign(Object.create(ParsedBlockPrototype), data);
}

export class ParsingStateBlock {
    blockTokens: BlockToken[];
    _footerTokens: BlockToken[];
    _document: DocumentState;
    blocks: ParsedBlock[] = [];
    appliedTokens: [string, BlockToken[]][];

    constructor() {
        this.blockTokens = [];
        this._footerTokens = [];

        this._document = new DocumentState();
        this.appliedTokens = [];
    }

    get document(): DocumentState {
        return this._document;
    }

    set document(document: DocumentState) {
        this._document = document;
    }

    addBlockToken(token: BlockToken | BlockTokenContainer) {
        if (token instanceof BlockTokenContainer) {
            this.blockTokens.push(...token.flatten());
        } else {
            this.blockTokens.push(token);
        }
    }

    addFooterToken(token: BlockToken) {
        this._footerTokens.push(token);
    }
}

export class ParsingStateInline {
    readonly relatedPoint: Point;
    readonly line: string;
    private _tokens: Map<number, InlineToken>;
    private escapedPositions: Set<number>;
    private _consumedIndices: Map<number, string>;
    protected _document: DocumentState;

    constructor(line: string, point: Point, document: DocumentState) {
        this.relatedPoint = point;
        this.line = line;
        this._tokens = new Map<number, InlineToken>();
        this.escapedPositions = new Set();
        this._consumedIndices = new Map();
        this._document = document;
    }

    get document(): DocumentState {
        return this._document;
    }

    addInlineToken(startPos: number, token: InlineToken) {
        if (!token.parseContent) {
            let [start, end, tag] = [startPos, token.positionEnd, token.tag];
            if (tag.length < 2) {
                tag += tag;
            }
            for (let i = start; i < end; i++) {
                this._consumedIndices.set(i, tag);
            }
        }
        this._tokens.set(startPos, token);
    }

    consume(start: number, end?: number) {
        end = end ?? start + 1;
        for (let i = start; i < end; i++) {
            this._consumedIndices.set(i, "consumed");
        }
    }

    get tokens() {
        return this._tokens;
    }

    escape(pos: number) {
        this.escapedPositions.add(pos);
        this._consumedIndices.set(pos, `\\${this.line.charAt(pos)}`);
    }

    isEscaped(pos: number): boolean {
        return this.escapedPositions.has(pos);
    }

    charAt(pos: number): string {
        let noParseTag = this._consumedIndices.get(pos);

        if (noParseTag) {
            return noParseTag;
        }
        return this.line.charAt(pos);
    }

    matchAll(regex: RegExp): RegExpExecArray[] {
        let matches = Array.from(this.line.matchAll(regex)).filter((m) => {
            const start = m.index;
            const end = start + m[0].length;
            for (let i = start; i < end; i++) {
                if (this._consumedIndices.has(i)) {
                    return false;
                }
                return true;
            }
        });

        return matches;
    }
}

function mergeDocumentState(left: DocumentState, right: DocumentState) {
    // headings
}

/** BlockRules don't mutate state directly. This class represents the change of state a rule wants to apply.
 * Once applied, the state is considered immutable, so there are only positive state changes
 * (i.e. a `StateChange` cannot remove tokens)
 */
export class StateChange extends ParsingStateBlock implements IDocumentState {
    private _startPoint: Point;
    private _endPoint: Point;
    private _wasApplied: boolean = false;
    success: boolean;
    executedBy: string;
    labels: Labels = { footnotes: [], refs: [] };

    constructor(
        document: DocumentState,
        startPoint: Point,
        executedBy?: string,
        endPoint?: Point,
        success: boolean = true,
    ) {
        super();
        this._startPoint = startPoint;
        this.success = success;
        this._endPoint = endPoint ?? { ...startPoint };
        this.executedBy = executedBy ?? "";
        this._document = document;
    }

    hasFootNote(label: string): boolean {
        return this._document.hasFootNote(label);
    }

    registerReference(label: string, url: string, title?: string): void {
        this.labels.refs.push(label);
        this._document.registerReference(label, url, title);
    }
    resolveReference(label: string, token: InlineToken): void {
        this.labels.refs.push(label);
        this._document.resolveReference(label, token);
    }
    registerFootnoteDef(
        label: string,
        destination: Token,
        onNumResolved: (footnoteNumber: number) => void,
    ): void {
        this.labels.footnotes.push(label);
        this._document.registerFootnoteDef(label, destination, onNumResolved);
    }
    resolveFootnoteRef(label: string, fnToken: Token): number {
        this.labels.footnotes.push(label);
        return this._document.resolveFootnoteRef(label, fnToken);
    }
    registerHeading(text: string, level: number, lineNumber: number, token: Token): void {
        this._document.registerHeading(text, level, lineNumber, token);
    }

    get wasApplied(): boolean {
        return this._wasApplied;
    }

    static fromState(
        state: ParsingStateBlock,
        startPoint: Point,
        executedBy?: string,
    ): StateChange {
        let stateChange = new StateChange(state.document, startPoint, executedBy);
        return stateChange;
    }

    applyToState(state: ParsingStateBlock, input: InputState) {
        state.blockTokens = state.blockTokens.concat(this.blockTokens);
        state._footerTokens = state._footerTokens.concat(this._footerTokens);
        state.appliedTokens.push([this.executedBy, this.blockTokens]);
        this._wasApplied = true;
        state.document = this.document;
        this.endPoint = input.currentPoint;
        const start = this.startPoint.line - 1;
        const end = this.endPoint.line - 2;

        let block: ParsedBlockData = {
            id: `markdown-block-${start}-${end}`,
            range: new Range(start, end),
            tokens: this.blockTokens,
            createdBy: this.executedBy,
            text: input.slice(start, end),
            ...this.labels,
        };
        state.blocks.push(createParsedBlock(block));
    }

    merge(other: StateChange) {
        this.blockTokens = this.blockTokens.concat(other.blockTokens);
        this.endPoint = other.endPoint;
        this.executedBy += ", " + other.executedBy;
    }

    revertInput(doc: InputState) {
        doc.currentPoint = this.startPoint;
    }

    get startPoint() {
        return { ...this._startPoint };
    }
    get endPoint(): Point {
        return { ...this._endPoint };
    }
    set endPoint(p: Point) {
        this._endPoint = { ...p };
    }
}
