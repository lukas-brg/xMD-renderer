import { MdInput, Point } from "./mdinput";
import { Token, BlockToken } from "./token";
import BlockRule from "./blockrules/blockrule";
import { Heading } from "./blockrules/heading";
import { UnorderedList } from "./blockrules/list";
import { Paragraph } from "./blockrules/paragraph";

type Rule = {
    handlerObj: BlockRule;
    terminatedBy: BlockRule[];
};

type RuleList = { [name: string]: Rule };

const rules: RuleList = {
    unordered_list: {
        handlerObj: UnorderedList,
        terminatedBy: [],
    },

    heading: {
        handlerObj: Heading,
        terminatedBy: [],
    },

    paragraph: {
        handlerObj: Paragraph,
        terminatedBy: [Heading, UnorderedList],
    },
};

export class ParsingState {
    tokens: Array<Token>;
    constructor() {
        this.tokens = new Array<Token>();
    }

    addBlockToken(token: Token) {
        this.tokens.push(token);
    }
}

export class StateChange extends ParsingState {
    private _startPoint: Point;
    private _endPoint: Point;
    success: boolean;
    constructor(startPoint: Point, endPoint?: Point, success: boolean = true) {
        super();
        this._startPoint = startPoint;
        this.success = success;
        this._endPoint = endPoint ?? { ...startPoint };
    }

    applyToState(state: ParsingState) {
        state.tokens = state.tokens.concat(this.tokens);
    }

    revertInput(doc: MdInput) {
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

export function parse(doc: MdInput) {
    let line;
    let state = new ParsingState();
    // let rules = [Heading, UnorderedList];

    while ((line = doc.nextLine()) != null) {
        for (let [ruleName, { handlerObj, terminatedBy }] of Object.entries(rules)) {
            let stateChange = handlerObj.process(doc, state);
            if (stateChange) {
                if (!stateChange.success) {
                    stateChange.revertInput(doc);
                } else {
                    stateChange.applyToState(state);
                }
            }
        }
    }
    // console.log(state.tokens.filter((t) => t.tagKind == "open" || t.tagKind == "close"));
    console.log(state.tokens);
}
