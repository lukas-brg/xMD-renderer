import { MdInput, Point } from "./mdinput";
import { leadingWhitespaces, isEmpty } from "./string_util";
import { Token, BlockToken } from "./token";
import { BlockRule } from "./rules";

export class ParsingState {
    tokens: Array<Token>;

    constructor() {
        this.tokens = new Array<Token>();
    }

    addBlockToken(token: Token) {
        this.tokens.push(token);
    }
}

export function parse(doc: MdInput, rules: BlockRule[]) {
    let line;
    let state = new ParsingState();

    while ((line = doc.nextLine()) != null) {
        for (let rule of rules) {
            rule.process(doc, state);
        }
    }
    console.log(state.tokens);
}
