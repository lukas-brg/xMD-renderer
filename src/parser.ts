import { InputState, Point } from "./input_state";
import { Token, BlockToken, InlineToken } from "./token";
import BlockRule from "./blockrules/blockrule";
import InlineRule from "./inline_rules/inline_rule";
import { Heading } from "./blockrules/heading";
import { Emphasis } from "./inline_rules/emphasis";
import { UnorderedList } from "./blockrules/list";
import { Paragraph } from "./blockrules/paragraph";
import { Escape } from "./inline_rules/escape";
import { Code } from "./inline_rules/code";

type FailureMode = "plaintext" | "applyPartially" | "ignore";

type BlockRuleEntry = {
    handlerObj: BlockRule;
    terminatedBy: BlockRule[];
    failureMode: FailureMode;
};

type BlockRuleList = { [name: string]: BlockRuleEntry };

type InlineRuleEntry = {
    handlerObj: InlineRule;
};

type InlineRuleList = { [name: string]: InlineRuleEntry };

const blockRules: BlockRuleList = {
    heading: {
        handlerObj: Heading,
        terminatedBy: [],
        failureMode: "applyPartially",
    },
    unordered_list: {
        handlerObj: UnorderedList,
        terminatedBy: [],
        failureMode: "applyPartially",
    },
    paragraph: {
        handlerObj: Paragraph,
        terminatedBy: [Heading, UnorderedList],
        failureMode: "applyPartially",
    },
};

const inlineRules: InlineRuleList = {
    escape: {
        handlerObj: Escape,
    },
    code: {
        handlerObj: Code,
    },
    emphasis: {
        handlerObj: Emphasis,
    },
};

export class ParsingStateBlock {
    blockTokens: BlockToken[];
    constructor() {
        this.blockTokens = [];
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
        if (!token.parseContent || token.tag) {
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

    applyToState(state: ParsingStateBlock) {
        state.blockTokens = state.blockTokens.concat(this.blockTokens);
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

function parseBlocks(doc: InputState, state: ParsingStateBlock) {
    let line;

    // let rules = [Heading, UnorderedList];
    while ((line = doc.nextLine()) != null) {
        for (let [ruleName, rule] of Object.entries(blockRules)) {
            rule.handlerObj.terminatedBy = rule.terminatedBy;
            let stateChange = rule.handlerObj.process(doc, state);
            if (stateChange) {
                if (!stateChange.success) {
                    switch (rule.failureMode) {
                        case "applyPartially":
                            stateChange.applyToState(state);
                            break;
                        case "plaintext":
                            stateChange.revertInput(doc);
                            break;
                        case "ignore":
                            break;
                    }
                } else {
                    // console.log(stateChange);
                    stateChange.applyToState(state);
                    break;
                }
            }
        }
    }
}

function parseInline(state: ParsingStateBlock) {
    for (let blockTok of state.blockTokens) {
        const line = blockTok.content;
        if (line) {
            if (blockTok.parseContent) {
                let inlineState = new ParsingStateInline(line, blockTok.relatedPosition);
                let anyRuleApplies = false;

                for (let [ruleName, rule] of Object.entries(inlineRules)) {
                    let success = rule.handlerObj.process(inlineState);
                    anyRuleApplies = anyRuleApplies || success;
                }

                if (!anyRuleApplies) {
                    blockTok.inlineTokens.push(InlineToken.createText(0, line));
                    continue;
                }

                let inlineTokens: InlineToken[] = [];

                let continousText = "";
                let textStart = 0;
                let i = 0;

                while (i < line.length) {
                    const tok = inlineState.tokens.get(i);
                    if (tok) {
                        if (continousText.length > 0) {
                            inlineTokens.push(
                                InlineToken.createText(textStart, continousText),
                            );
                        }
                        inlineTokens.push(tok);
                        i = tok.positionEnd;
                        continousText = "";
                        textStart = i;
                    } else {
                        continousText += line.charAt(i);
                        i++;
                    }
                }

                if (continousText.length > 0) {
                    inlineTokens.push(InlineToken.createText(textStart, continousText));
                }
                blockTok.inlineTokens = inlineTokens;
            } else {
                blockTok.inlineTokens.push(
                    InlineToken.createText(blockTok.relatedPosition.column, line),
                );
            }
        }
    }
}

export function parse(doc: InputState) {
    let state = new ParsingStateBlock();
    parseBlocks(doc, state);
    parseInline(state);
    return state;
    // console.log(state.tokens.filter((t) => t.tagKind == "open" || t.tagKind == "close"));
    // console.log(state.tokens);
}
