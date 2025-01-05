import { ParsingStateInline } from "../parser";
import InlineRule from "./inline_rule";
import { InlineToken } from "../token";

const ESCAPABLE: Set<string> = new Set([
    "\\",
    "*",
    "!",
    "'",
    "(",
    ")",
    "[",
    "]",
    "{",
    "}",
    "_",
    "+",
    "-",
    ".",
    "|",
    "<",
    ">",
    "`",
]);

export const Escape: InlineRule = {
    name: "escape",

    process: (state: ParsingStateInline) => {
        const line = state.line;
        const matches = new Set([...line.matchAll(/\\/g)].map((match) => match.index));
        if (matches.size == 0) return false;
        let didEscape = false;
        for (let backslashPos of matches) {
            if (matches.has(backslashPos - 1)) continue; // When a backslash is escaped

            const charPos = backslashPos + 1;
            const escapedChar = line.charAt(charPos);

            if (!ESCAPABLE.has(escapedChar)) continue;

            state.escapedPositions.add(charPos);
            state.addInlineToken(
                backslashPos,
                InlineToken.createText(backslashPos, escapedChar, backslashPos + 2),
            );
            didEscape = true;
        }

        return didEscape;
    },
};
