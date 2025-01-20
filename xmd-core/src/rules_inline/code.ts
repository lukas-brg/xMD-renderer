import { DeferredState, ParsingStateInline } from "../parsing_state.js";
import InlineRule from "./inline_rule.js";
import { InlineToken } from "../token.js";
import { pairs } from "../util.js";
import { RuleState } from "../rules.js";

export const Code: InlineRule = {
    name: "code",

    process: (state: ParsingStateInline, ruleState: RuleState) => {
        const line = state.line;
        const matches: number[] = [...line.matchAll(/`/g)]
            .map((match) => match.index)
            .filter((i) => !state.isEscaped(i));

        if (matches.length == 0) return false;

        for (let [start, end] of pairs(matches)) {
            if (end - start < 2) continue;
            state.addInlineToken(
                start,
                InlineToken.createWrapped(
                    "code",
                    start,
                    Code.name,
                    line.substring(start + 1, end),
                    end + 1,
                    false,
                ),
            );
        }
        return true;
    },
};
