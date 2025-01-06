import { Point, InputState } from "./input_state.js";
import { BlockToken, InlineToken, Token } from "./token.js";
import { makeIdString } from "./string_utils.js";

export type HeadingForm = {
    text: string;
    level: number;
    lineNumber: number;
    token: Token;
};

type HeadingEntry = HeadingForm & { id: string };

export class ParsingStateBlock {
    blockTokens: BlockToken[];
    _headings: HeadingEntry[];
    _headingIds: Map<string, number>;
    constructor() {
        this.blockTokens = [];
        this._headings = [];
        this._headingIds = new Map();
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
    private _noParseIndices: Map<number, string>;

    constructor(line: string, point: Point) {
        this.relatedPoint = point;
        this.line = line;
        this._tokens = new Map<number, InlineToken>();
        this.escapedPositions = new Set();
        this._noParseIndices = new Map();
    }

    addInlineToken(startPos: number, token: InlineToken) {
        if (!token.parseContent) {
            let [start, end, tag] = [startPos, token.positionEnd, token.tag];

            for (let i = start; i < end; i++) {
                this._noParseIndices.set(i, tag);
            }
        }
        this._tokens.set(startPos, token);
    }

    get tokens() {
        return this._tokens;
    }

    get headings(): HeadingEntry[] {
        return this.headings;
    }

    escape(pos: number) {
        this.escapedPositions.add(pos);
        this._noParseIndices.set(pos, `\\${this.line.charAt(pos)}`);
    }

    isEscaped(pos: number): boolean {
        return this.escapedPositions.has(pos);
    }

    charAt(pos: number): string {
        let noParseTag = this._noParseIndices.get(pos);

        if (noParseTag) {
            return noParseTag;
        }
        return this.line.charAt(pos);
    }
}

/** Rules don't mutate state directly. This class represents the change of state a rule wants to apply.
 * Once applied, the state is considered immutable, so there are only positive state changes
 * (i.e. a `StateChange` cannot remove tokens)
 */
export class StateChange extends ParsingStateBlock {
    private _startPoint: Point;
    private _endPoint: Point;
    success: boolean;
    executedBy: string;
    subStateChanges: StateChange[] = [];
    constructor(
        startPoint: Point,
        executedBy: string,
        endPoint?: Point,
        success: boolean = true,
    ) {
        super();
        this._startPoint = startPoint;
        this.success = success;
        this._endPoint = endPoint ?? { ...startPoint };
        this.executedBy = executedBy;
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
