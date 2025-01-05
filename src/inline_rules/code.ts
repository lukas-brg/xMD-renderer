import { ParsingStateInline } from "../parser";
import InlineRule from "./inline_rule";
import { InlineToken } from "../token";
import { pairs } from "../util";

export const Code: InlineRule = {
    name: "code",

    process: (state: ParsingStateInline) => {
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
                    line.substring(start + 1, end),
                    end + 1,
                    false,
                ),
            );
        }
        return true;
    },
};
