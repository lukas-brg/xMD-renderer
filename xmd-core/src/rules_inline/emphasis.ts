import { DeferredState, ParsingStateInline } from "../parsing_state.js";
import InlineRule from "./inline_rule.js";
import { InlineToken } from "../token.js";
import { Dict } from "../util.js";
import { pairs } from "../util.js";
import { RuleState } from "../rules.js";

export const Emphasis: InlineRule = {
    name: "emphasis",

    process: (state: ParsingStateInline, ruleState: RuleState) => {
        // prettier-ignore
        let tokenPositions: Dict<number[]> = {
            "*": [],
            "**": [],
            "_": [],
            "__": [],
        };

        // prettier-ignore

        let posAstr = state.findIndices(/\*/g);
        let posUnder = state.findIndices(/_/g);

        if (!posAstr && !posUnder) return false;

        let stack: string[] = [];
        for (let i = 0; i < state.line.length; ) {
            const char = state.charAt(i);
            if (char == "_" || char == "*") {
            }
            i++;
        }

        let madeChange = false;

        for (let [tok, positions] of Object.entries(tokenPositions)) {
            if (positions.length % 2 != 0) continue;
            const tokLen = tok.length;
            const tag = tokLen == 2 ? "strong" : "em";
            for (let [start, end] of pairs(positions)) {
                state.addInlineToken(
                    start,
                    InlineToken.createOpening(tag, start, Emphasis.name, start + tokLen),
                );
                state.addInlineToken(
                    end,
                    InlineToken.createClosing(tag, end, Emphasis.name, end + tokLen),
                );
                madeChange = true;
            }
        }

        return madeChange;
    },
};
