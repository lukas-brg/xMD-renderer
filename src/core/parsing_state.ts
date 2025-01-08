import { Point, InputState } from "./input_state.js";
import { BlockToken, InlineToken, Token } from "./token.js";
import { makeIdString } from "./string_utils.js";
import { ReferenceManager } from "./reference_manager.js";

export type HeadingForm = {
    text: string;
    level: number;
    lineNumber: number;
    token: Token;
};

type HeadingEntry = HeadingForm & { id: string };

export class ParsingStateBlock {
    blockTokens: BlockToken[];
    references: ReferenceManager;
    _headings: HeadingEntry[];
    _headingIds: Map<string, number>;

    constructor() {
        this.blockTokens = [];
        this._headings = [];
        this._headingIds = new Map();
        this.references = new ReferenceManager();
    }

    registerReference(label: string, url: string, title?: string) {
        this.references.registerReference(label, url, title);
    }

    resolveReference(label: string, token: InlineToken) {
        this.references.resolveReference(label, token);
    }

    registerFootnoteDef(
        label: string,
        destinationTok: Token,
        callback: (footnoteNumber: number) => void,
    ) {
        this.references.registerFootnote(label, destinationTok, callback);
    }
    resolveFootnoteRef(label: string, destinationTok: Token) {
        this.references.resolveFootnote(label, destinationTok);
    }

    addBlockToken(token: BlockToken) {
        this.blockTokens.push(token);
    }
}

export class ParsingStateInline {
    readonly relatedPoint: Point;
    readonly line: string;
    private _tokens: Map<number, InlineToken>;
    private escapedPositions: Set<number>;
    private _consumedIndices: Map<number, string>;

    private references: ReferenceManager;

    constructor(line: string, point: Point, references: ReferenceManager) {
        this.relatedPoint = point;
        this.line = line;
        this._tokens = new Map<number, InlineToken>();
        this.escapedPositions = new Set();
        this._consumedIndices = new Map();
        this.references = references;
    }

    resolveFootnoteRef(label: string, destinationTok: Token): number {
        return this.references.resolveFootnote(label, destinationTok);
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

    registerReference(label: string, url: string, title?: string) {
        this.references.registerReference(label, url, title);
    }

    resolveReference(label: string, token: InlineToken) {
        this.references.resolveReference(label, token);
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

    get headings(): HeadingEntry[] {
        return this.headings;
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
    subStateChanges: StateChange[] = [];

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

    static usingState(
        state: ParsingStateBlock,
        startPoint: Point,
        executedBy?: string,
    ): StateChange {
        let stateChange = new StateChange(startPoint, executedBy);
        stateChange.references = state.references;
        return stateChange;
    }

    registerHeading(heading: HeadingForm) {
        const id = makeIdString(heading.text);
        this._headings.push({ ...heading, id: id });
    }

    applyToState(state: ParsingStateBlock) {
        state.blockTokens = state.blockTokens.concat(this.blockTokens);
        for (const heading of this._headings) {
            let count = state._headingIds.get(heading.id) ?? 0;
            let uniqueId;
            if (count > 0) {
                uniqueId = `${heading.id}-${count}`;
            } else {
                uniqueId = heading.id;
            }
            count++;
            state._headingIds.set(heading.id, count);
            heading.id = uniqueId;
            state._headings.push(heading);
            heading.token.addAttribute("id", uniqueId);
        }
        this._wasApplied = true;
        state.references = this.references;
    }

    merge(other: StateChange) {
        this.blockTokens = this.blockTokens.concat(other.blockTokens);
        this.endPoint = other.endPoint;
        this.executedBy += ", " + other.executedBy;
        this._headings = this._headings.concat(other._headings);
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
