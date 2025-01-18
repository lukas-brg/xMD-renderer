import { warnInline } from "../errors.js";
import { InputState } from "../input_state.js";
import { ParsingStateBlock, StateChange } from "../parsing_state.js";
import { makeIdString } from "../string_utils.js";
import { BlockToken } from "../token.js";
import BlockRule from "./blockrule.js";
import { warn } from "../errors.js";

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
        if (stateChange.hasFootNote(label)) {
            warn(
                `Duplicate definitions of footnote '${label}'   line: ${input.currentPoint.line}   '${input.currentLine()}'`,
            );
            stateChange.addBlockToken(
                BlockToken.createPreservedText(
                    input.currentPoint,
                    FootnoteDef.name,
                    input.currentLine(),
                ),
            );
            input.nextLine();
            return true;
        }
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
            content,
            1,
        ).withAnnotation("footnote-def");
        stateChange.registerFootnoteDef(label, fnTok, (fnNum) => {
            fnTok.content = `${fnNum}. ${fnTok.content}`;
        });
        stateChange.addFooterToken(fnTok);

        stateChange.addFooterToken(
            BlockToken.createWrapped(
                "a",
                input.currentPoint,
                FootnoteDef.name,
                "Link",
                1,
            ).withAttribute("href", `#ref-${makeIdString(label)}`),
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
