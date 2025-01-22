import { warnInline } from "../errors.js";
import { InputState } from "../input_state.js";
import { ParsingStateBlock, StateChange } from "../parsing_state.js";
import { normalizeString } from "../string_utils.js";
import { BlockToken, DeferredTokenState } from "../token.js";
import BlockRule from "./blockrule.js";
import { warn } from "../errors.js";
import { FootnoteRef } from "../rules_inline/footnote_ref.js";

const regex = /^\s*\[\^(\w+)\]:\s*(\w+.*)/g;
export const FootnoteDef: BlockRule = {
    name: "footnote_def",

    process: (
        input: InputState,
        state: Readonly<ParsingStateBlock>,
        stateChange: StateChange,
    ) => {
        const line = input.currentLine();
        const match = [...line.matchAll(regex)];
        if (match.length == 0) return false;
        let [wholeMatch, label, content] = match[0];
        label = normalizeString(label);
        stateChange.addFooterToken(
            BlockToken.createContentless(
                "p",
                input.currentPoint,
                FootnoteDef.name,
                "open",
                0,
            ),
        );

        let fnTok = BlockToken.createWrapped(
            "span",
            input.currentPoint,
            FootnoteDef.name,
            "",
            1,
        );
        fnTok.attachDeferredState({
            identifier: label,
            updatedBy: [FootnoteRef.name],
            values: {},
            sourceRule: FootnoteDef.name,
            onUpdate(values) {
                fnTok.content = `${values.number}. ${content}`;
            },
        });

        stateChange.addFooterToken(fnTok);

        stateChange.addFooterToken(
            BlockToken.createWrapped(
                "a",
                input.currentPoint,
                FootnoteDef.name,
                "Link",
                1,
            ).withAttributes({
                id: `def-${label}`,
                href: `#ref-${label}`,
            }),
        );

        stateChange.addFooterToken(
            BlockToken.createContentless(
                "p",
                input.currentPoint,
                FootnoteDef.name,
                "close",
                0,
            ),
        );

        input.nextLine();
        return true;
    },
};
