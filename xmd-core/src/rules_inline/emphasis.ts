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
        let stack: string[] = [];

        for (let i = 0; i < state.line.length; ) {
            const char = state.charAt(i);
            if (char == "_" || char == "*") {
                if (stack[stack.length - 1] == char) {
                    tokenPositions[char].push(i);
                    stack.pop();
                    i += 1;
                    continue;
                }

                if (state.charAt(i + 1) == char) {
                    if (stack[stack.length - 1] == char + char) {
                        tokenPositions[char + char].push(i);
                        stack.pop();
                        i += 2;
                        continue;
                    }
                    tokenPositions[char + char].push(i);
                    stack.push(char + char);
                    i += 2;
                    continue;
                }
                tokenPositions[char].push(i);
                stack.push(char);
                i += 1;
                continue;
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
                    InlineToken.createContentless(
                        tag,
                        start,
                        Emphasis.name,
                        "open",
                        start + tokLen,
                    ),
                );
                state.addInlineToken(
                    end,
                    InlineToken.createContentless(
                        tag,
                        end,
                        Emphasis.name,
                        "close",
                        end + tokLen,
                    ),
                );
                madeChange = true;
            }
        }

        return madeChange;
    },
};
