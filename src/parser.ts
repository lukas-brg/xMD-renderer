import { InputState, Point } from "./input_state";
import { Token, BlockToken, InlineToken } from "./token";
import BlockRule from "./blockrules/blockrule";
import InlineRule from "./inline_rules/inline_rule";
import { Heading } from "./blockrules/heading";
import { Emphasis } from "./inline_rules/emphasis";
import { UnorderedList } from "./blockrules/list";
import { Paragraph } from "./blockrules/paragraph";

type FailureMode = "plaintext" | "applyPartially" | "ignore";

type BlockRuleEntry = {
    handlerObj: BlockRule;
    terminatedBy: BlockRule[];
    failureMode: FailureMode;
};

type BlockRuleList = { [name: string]: BlockRuleEntry };

type InlineRuleEntry = {
    handlerObj: InlineRule;
    failureMode: FailureMode;
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
    emphasis: {
        handlerObj: Emphasis,
        failureMode: "plaintext",
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
    tokenList: InlineToken[];
    relatedPoint: Point;
    line: string;
    currentPos: number;
    stack: InlineToken[];
    tokens: Map<number, InlineToken>;

    constructor(line: string, point: Point) {
        this.tokenList = [];
        this.relatedPoint = point;
        this.line = line;
        this.currentPos = 0;
        this.stack = [];
        this.tokens = new Map<number, InlineToken>();
    }

    addInlineToken(token: InlineToken) {
        this.tokenList.push(token);
    }

    currentChar(): string {
        const idx = Math.max(0, this.currentPos - 1);
        return this.line.charAt(idx);
    }

    peek(): string | null {
        if (this.currentPos >= this.line.length) {
            return null;
        }
        return this.line.charAt(this.currentPos);
    }

    advance(): string | null {
        if (this.currentPos >= this.line.length) {
            return null;
        }
        return this.line.charAt(this.currentPos++);
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
                let char;
                while ((char = inlineState.advance()) != null) {
                    let success = false;
                    for (let [ruleName, rule] of Object.entries(inlineRules)) {
                        success = rule.handlerObj.process(inlineState);
                        if (success) break;
                    }
                    if (!success) {
                        let point = blockTok.relatedPosition;
                        point.column += inlineState.currentPos;
                        inlineState.addInlineToken(InlineToken.createText(point, char));
                    }
                }
                console.log("A", inlineState.tokenList);
                blockTok.inlineTokens = inlineState.tokenList;
            } else {
                blockTok.inlineTokens.push(
                    InlineToken.createText(blockTok.relatedPosition, line),
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
