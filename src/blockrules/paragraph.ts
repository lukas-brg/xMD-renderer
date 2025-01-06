import { Token, BlockToken } from "../token.js";
import { InputState } from "../input_state.js";
import { ParsingStateBlock, StateChange } from "../parsing_state.js";
import BlockRule from "./blockrule.js";

export const Paragraph: BlockRule = {
    name: "paragraph",
    process: (input: InputState, state: Readonly<ParsingStateBlock>) => {
        let stateChange = new StateChange(input.currentPoint, Paragraph.name);
        let containsText = false;
        stateChange.addBlockToken(
            BlockToken.createContentless("p", input.currentPoint, "open"),
        );

        while (input.isEmptyLine()) {
            if (input.nextLine() === null) {
                break;
            }
        }
        do {
            for (const ruleObj of Paragraph.terminatedBy ?? []) {
                const otherStateChange = ruleObj.process(input, state);
                if (otherStateChange) {
                    stateChange.addBlockToken(
                        BlockToken.createContentless("p", input.currentPoint, "close"),
                    );
                    if (!containsText) {
                        return otherStateChange;
                    }
                    stateChange.merge(otherStateChange);
                    return stateChange;
                }
            }

            if (input.isEmptyLine()) {
                break;
            }

            let line = input.currentLine();
            stateChange.addBlockToken(BlockToken.createText(input.currentPoint, line, 1));
            containsText = true;
            if (input.trailingWhitespaces() >= 2) {
                stateChange.addBlockToken(
                    BlockToken.createSelfClosing("br", input.currentPoint),
                );
            }
        } while (input.nextLine() != null);
        stateChange.addBlockToken(
            BlockToken.createContentless("p", input.currentPoint, "close"),
        );
        stateChange.endPoint = input.currentPoint;
        return stateChange;
    },
};
