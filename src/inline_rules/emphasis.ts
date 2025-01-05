import { ParsingStateInline } from "../parser";
import InlineRule from "./inline_rule";
import { InlineToken } from "../token";
import { Dict } from "../util";

export const Emphasis: InlineRule = {
    name: "emphasis",

    process: (state: ParsingStateInline) => {
        let tokenPositions: Dict<number[]> = {
            "*": [],
            "**": [],
            _: [],
            __: [],
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
            const num = positions.length;
            if (num % 2 != 0) continue;
            const tokLen = tok.length;
            const tag = tokLen == 2 ? "strong" : "em";
            let even = true;
            for (let pos of positions) {
                const tagKind = even ? "open" : "close";
                state.tokens.set(
                    pos,
                    InlineToken.createContentless(tag, pos, tagKind, pos + tokLen),
                );
                madeChange = true;
                even = !even;
            }
        }

        return madeChange;
    },
};
