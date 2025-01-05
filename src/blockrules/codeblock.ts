import { InputState } from "../input_state";
import { ParsingStateBlock, StateChange } from "../parser";
import { BlockToken, Token } from "../token";
import BlockRule from "./blockrule";
import { leadingWhitespaces, isEmpty } from "../string_utils";

export const CodeblockFenced: BlockRule = {
    name: "codeblock_fenced",

    process: (input: InputState, state: Readonly<ParsingStateBlock>) => {
        let stateChange = new StateChange(input.currentPoint, CodeblockFenced.name);
        const line = input.currentLine();
        if (!line.startsWith("```")) return null;
        stateChange.addBlockToken(
            BlockToken.createContentless("pre", input.currentPoint, "open", 1),
        );
        stateChange.addBlockToken(
            BlockToken.createContentless("code", input.currentPoint, "open"),
        );
        while (!input.nextLine()?.startsWith("```")) {
            stateChange.addBlockToken(
                BlockToken.createPreservedText(
                    input.currentPoint,
                    input.currentLine(),
                    2,
                ),
            );
        }

        stateChange.addBlockToken(
            BlockToken.createContentless("code", input.currentPoint, "close"),
        );
        stateChange.addBlockToken(
            BlockToken.createContentless("pre", input.currentPoint, "close", 1),
        );
        return stateChange;
    },
};

// export default Heading;
