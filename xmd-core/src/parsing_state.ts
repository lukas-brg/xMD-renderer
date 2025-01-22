import { Point, InputState } from "./input_state.js";
import {
    BlockToken,
    BlockTokenContainer,
    InlineToken,
    Token,
    DeferredTokenState as DeferredStateEntry,
} from "./token.js";

import { MultiMap, Range } from "./util.js";
import { RuleState } from "./rules.js";
import { normalizeString } from "./string_utils.js";

type Labels = {
    footnotes: string[];
    refs: string[];
};

interface IParsingState {
    _tokens: Token[];
    _footerTokens: Token[];
    _ids: Map<string, number>;
}

interface IParsingMethods extends IParsingState {
    addToken(token: Token): void;
    addFooterToken(token: Token): void;
}

export type DeferredTokenStateEntry = DeferredStateEntry & {
    token: Token;
};

export type DeferredState = MultiMap<string, DeferredTokenStateEntry>;

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

export class ParsingStateBlock implements IParsingMethods {
    _tokens: BlockToken[];
    _footerTokens: BlockToken[];
    blocks: ParsedBlock[] = [];
    appliedTokens: [string, BlockToken[]][];
    deferredState: Map<string, MultiMap<string, DeferredTokenStateEntry>>;
    ruleStates: Map<string, RuleState>;
    _ids: Map<string, number>;

    constructor() {
        this._tokens = [];
        this._footerTokens = [];
        this.appliedTokens = [];
        this.deferredState = new Map();
        this.ruleStates = new Map();
        this._ids = new Map();
    }

    addTokenContainer(container: BlockTokenContainer) {
        this._tokens.push(...container.flatten());
    }
    addToken(token: BlockToken) {
        if (token instanceof BlockTokenContainer) {
            this._tokens.push(...token.flatten());
        } else {
            this._tokens.push(token);
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
    ruleState: MultiMap<string, DeferredTokenStateEntry>;

    constructor(line: string, point: Point) {
        this.relatedPoint = point;
        this.line = line;
        this._tokens = new Map<number, InlineToken>();
        this.escapedPositions = new Set();
        this._consumedIndices = new Map();
        this.ruleState = new MultiMap();
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

/** BlockRules don't mutate state directly. This class represents the change of state a rule wants to apply.
 * Once applied, the state is considered immutable, so there are only positive state changes
 * (i.e. a `StateChange` cannot remove tokens)
 */
export class StateChange implements IParsingMethods {
    private _startPoint: Point;
    private _endPoint: Point;
    private _wasApplied: boolean = false;
    success: boolean;
    executedBy: string;
    labels: Labels = { footnotes: [], refs: [] };
    _tokens: BlockToken[];
    _footerTokens: BlockToken[];

    ruleStates: Map<string, RuleState>;
    _ids: Map<string, number>;
    private newIds: [string, number][];

    constructor(
        startPoint: Point,
        ids: Map<string, number>,
        executedBy?: string,
        endPoint?: Point,
        success: boolean = true,
    ) {
        this._startPoint = startPoint;
        this.success = success;
        this._endPoint = endPoint ?? { ...startPoint };
        this.executedBy = executedBy ?? "";
        this._tokens = [];
        this._footerTokens = [];
        this.ruleStates = new Map();
        this.newIds = [];
        this._ids = ids;
    }

    get wasApplied(): boolean {
        return this._wasApplied;
    }

    static fromState(
        state: ParsingStateBlock,
        startPoint: Point,
        executedBy?: string,
    ): StateChange {
        let stateChange = new StateChange(startPoint, state._ids, executedBy);
        return stateChange;
    }

    registerSharedState(token: BlockToken, state: DeferredStateEntry) {
        for (let ruleName of state.updatedBy) {
            this.ruleStates
                .get(ruleName)!
                .deferredState.add(state.identifier, { ...state, token });
        }
    }

    addTokenContainer(container: BlockTokenContainer) {
        this._tokens.push(...container.flatten());
    }

    addToken(token: BlockToken) {
        if (token.state) {
            this.registerSharedState(token, token.state);
        }
        this._tokens.push(token);
    }

    addFooterToken(token: BlockToken) {
        if (token.state) {
            this.registerSharedState(token, token.state);
        }
        this._footerTokens.push(token);
    }

    registerUniqueId(text: string): string {
        const normalized = normalizeString(text);

        let count = this._ids.get(normalized) ?? 0;
        let uniqueId = normalized;

        if (count != 0) {
            uniqueId += `-${count}`;
        }
        count++;

        this.newIds.push([normalized, count]);
        return uniqueId;
    }

    applyToState(state: ParsingStateBlock, input: InputState) {
        state.appliedTokens.push([this.executedBy, this._tokens]);
        this._wasApplied = true;
        this.endPoint = input.currentPoint;
        const start = this.startPoint.line - 1;
        const end = this.endPoint.line - 2;
        state._footerTokens.push(...this._footerTokens);

        state._tokens.push(...this._tokens);

        for (let [ruleName, ruleState] of this.ruleStates.entries()) {
            let stateRuleState = state.ruleStates.get(ruleName)!;
            for (let [key, values] of ruleState.deferredState.entries()) {
                stateRuleState.deferredState.add(key, ...values);
            }
        }

        for (let [id, count] of this.newIds) {
            state._ids.set(id, count);
        }

        let block: ParsedBlockData = {
            id: `markdown-block-${start}-${end}`,
            range: new Range(start, end),
            tokens: this._tokens,
            createdBy: this.executedBy,
            text: input.slice(start, end),
            ...this.labels,
        };
        state.blocks.push(createParsedBlock(block));
    }

    merge(other: StateChange) {
        this._tokens = this._tokens.concat(other._tokens);
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
