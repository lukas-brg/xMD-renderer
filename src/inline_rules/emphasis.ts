import { ParsingStateInline } from "../parser";
import InlineRule from "./inline_rule";
import { InlineToken } from "../token";

type Dict<T> = { [key: string]: T };

export const Emphasis: InlineRule = {
    name: "emphasis",

    process: (state: ParsingStateInline) => {
        let tokenPositions: Dict<number[]> = {
            "*": [],
            "**": [],
            _: [],
            __: [],
        };

        for (let i = 0; i < state.line.length - 1; ) {
            const char = state.charAt(i);
            if (char == "_" || char == "*") {
                if (state.charAt(i + 1) == char) {
                    tokenPositions[char + char].push(i);
                    i += 2;
                    continue;
                } else {
                    tokenPositions[char].push(i);
                }
            }
            i++;
        }

        const lastIdx = state.line.length - 1;
        const char = state.charAt(lastIdx);
        if (char == "_" || char == "*") {
            tokenPositions[char].push(lastIdx);
        }
        let madeChange = false;

        for (let [tok, positions] of Object.entries(tokenPositions)) {
            const num = positions.length;
            if (num % 2 != 0) continue;
            const tokLen = tok.length;
            const tag = tokLen == 2 ? "strong" : "emph";
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
