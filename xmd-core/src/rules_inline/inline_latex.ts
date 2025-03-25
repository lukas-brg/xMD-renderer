import { DeferredState, ParsingStateInline } from "../parsing_state.js";
import InlineRule from "./inline_rule.js";
import { InlineToken } from "../token.js";
import { pairs } from "../util.js";
import { RuleState } from "../rules.js";
import katex from "katex";

export const InlineLatex: InlineRule = {
    name: "inline_latex",

    process: (state: ParsingStateInline, ruleState: RuleState) => {
        const line = state.line;
        const matches: number[] = state.matchAll(/\$/g).map((match) => match.index);

        if (matches.length <= 1) return false;
        for (let [start, end] of pairs(matches)) {
            if (end - start < 2) continue;
            let latexCode = line.substring(start + 1, end);
            const html = katex.renderToString(latexCode);
            state.addInlineToken(
                start,
                InlineToken.createWrapped(
                    "span",
                    start,
                    InlineLatex.name,
                    html,
                    end + 1,
                    false,
                ).withAttribute("class", "inline-latex"),
            );
        }
        return true;
    },
};
