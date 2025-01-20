import { DeferredState, ParsingStateInline } from "../parsing_state.js";
import InlineRule from "./inline_rule.js";
import { InlineToken } from "../token.js";
import { Dict } from "../util.js";
import { pairs } from "../util.js";
import { RuleState } from "../rules.js";
import { normalizeString } from "../string_utils.js";

const regex = /\[\^(\w+)\]/g;

export const FootnoteRef: InlineRule = {
    name: "footnote_ref",

    process: (state: ParsingStateInline, ruleState: RuleState) => {
        let madeChange = false;
        state.matchAll(regex).forEach((match) => {
            const label = normalizeString(match[1]);

            const number = ruleState.ruleState.get("number") ?? 1;
            ruleState.ruleState.set("number", number + 1);

            for (let deferred of ruleState.deferredState.get(label)) {
                deferred.onUpdate({ number: number });
            }
            let end = match.index + match[0].length;
            let reference = InlineToken.createWrapped(
                "a",
                match.index,
                FootnoteRef.name,
                `<sup>[${number}]</sup>`,
                end + 2,
                false,
            ).withAttributes({
                id: `ref-${label}`,
                href: `#def-${label}`,
            });

            state.addInlineToken(match.index, reference);

            madeChange = true;
        });

        return madeChange;
    },
};
