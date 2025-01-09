import { Point, InputState } from "./input_state.js";
import { BlockToken, InlineToken, Token } from "./token.js";

import { DocumentState } from "./document_state.js";

export class ParsingStateBlock {
    blockTokens: BlockToken[];
    _footerTokens: BlockToken[];
    _document: DocumentState;

    constructor() {
        this.blockTokens = [];
        this._footerTokens = [];

        this._document = new DocumentState();
    }

    get document(): DocumentState {
        return this._document;
    }

    set document(document: DocumentState) {
        this._document = document;
    }

    addBlockToken(token: BlockToken) {
        this.blockTokens.push(token);
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

    constructor(line: string, point: Point, references: DocumentState) {
        this.relatedPoint = point;
        this.line = line;
        this._tokens = new Map<number, InlineToken>();
        this.escapedPositions = new Set();
        this._consumedIndices = new Map();
        this._document = references;
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

    matchAll(regex: RegExp): RegExpStringIterator<RegExpExecArray> {
        let matches = this.line.matchAll(regex).filter((m) => {
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

/** Rules don't mutate state directly. This class represents the change of state a rule wants to apply.
 * Once applied, the state is considered immutable, so there are only positive state changes
 * (i.e. a `StateChange` cannot remove tokens)
 */
export class StateChange extends ParsingStateBlock {
    private _startPoint: Point;
    private _endPoint: Point;
    private _wasApplied: boolean = false;
    success: boolean;
    executedBy: string;

    constructor(
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
    }

    get wasApplied(): boolean {
        return this._wasApplied;
    }

    static fromState(
        state: ParsingStateBlock,
        startPoint: Point,
        executedBy?: string,
    ): StateChange {
        let stateChange = new StateChange(startPoint, executedBy);
        stateChange._document = state.document;
        return stateChange;
    }

    applyToState(state: ParsingStateBlock) {
        state.blockTokens = state.blockTokens.concat(this.blockTokens);
        state._footerTokens = state._footerTokens.concat(this._footerTokens);

        this._wasApplied = true;
        state.document = this.document;
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
