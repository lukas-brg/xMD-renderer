import { ParsingStateInline } from "../parsing_state.js";
import InlineRule from "./inline_rule.js";
import { InlineToken } from "../token.js";
import { Dict } from "../util.js";
import { pairs } from "../util.js";

const regex = /\[\^(\w+)\]/g;

export const FootnoteRef: InlineRule = {
    name: "footnote_ref",

    process: (state: ParsingStateInline) => {
        let madeChange = false;
        state.matchAll(regex).forEach((match) => {
            const label = match[1];
            let end = match.index + match[0].length;
            let reference = InlineToken.createWrapped(
                "a",
                match.index,
                FootnoteRef.name,
                "",
                end + 2,
                false,
            ).withAnnotation("footnote-ref");

            const no = state.resolveFootnoteRef(label, reference);
            reference.content = `<sup>[${no}]</sup>`;
            state.addInlineToken(match.index, reference);

            madeChange = true;
        });

        return madeChange;
    },
};
