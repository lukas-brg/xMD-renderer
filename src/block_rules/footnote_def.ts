import { InputState } from "../input_state.js";
import { ParsingStateBlock, StateChange } from "../parsing_state.js";
import { BlockToken } from "../token.js";
import BlockRule from "./blockrule.js";

const regex = /^\s*\[\^(\w+)\]:\s*(\w+.*)/g;

export const FootnoteDef: BlockRule = {
    name: "footnote_def",

    process: (input: InputState, state: Readonly<ParsingStateBlock>) => {
        let stateChange = new StateChange(input.currentPoint, FootnoteDef.name);
        stateChange.references = state.references; // Todo: temporary workaround
        const line = input.currentLine();
        const match = [...line.matchAll(regex)];
        if (match.length == 0) return null;
        let [wholeMatch, label, content] = match[0];
        let fnTok = BlockToken.createWrapped(
            "span",
            input.currentPoint,
            content,
        ).withAnnotation("footnote-def");
        stateChange.registerFootnoteDef(label, fnTok, (fnNum) => {
            fnTok.content = `${fnNum}. ${fnTok.content}`;
        });

        stateChange.addBlockToken(fnTok);
        return stateChange;
    },
};
