import { DeferredState, ParsingStateInline } from "../parsing_state.js";
import InlineRule from "./inline_rule.js";
import { InlineToken } from "../token.js";
import { Dict } from "../util.js";
import { pairs } from "../util.js";
import { RuleState } from "../rules.js";
const chars = new Set(["*", "_", " "]);

function isLeftFlanking(pos: number, line: string): boolean {
    if (pos + 1 >= line.length) {
        return false;
    }
    return !chars.has(line.charAt(pos + 1));
}

export const Emphasis: InlineRule = {
    name: "emphasis",

    process: (state: ParsingStateInline, ruleState: RuleState) => {
        // prettier-ignore

        let posAstr = state.findIndices(/\*/g);
        let posUnder = state.findIndices(/_/g);

        if (!posAstr && !posUnder) return false;
        // *j*text*
        let stack: [number, string][] = [];
        for (let i = 0; i < posAstr.length - 1; i++) {
            const pos = posAstr[i];
            if (posAstr[i + 1] === pos + 1) {
                stack.push([pos, "**"]);
            } else {
                stack.push([pos, "*"]);
            }
        }

        let madeChange = false;

        return madeChange;
    },
};
