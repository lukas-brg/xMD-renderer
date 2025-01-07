import { Token, BlockToken } from "../token.js";
import { InputState } from "../input_state.js";
import { ParsingStateBlock, StateChange } from "../parsing_state.js";
import BlockRule from "./blockrule.js";

export const Paragraph: BlockRule = {
    name: "paragraph",
    process: (input: InputState, state: Readonly<ParsingStateBlock>) => {
        let containsText = false;

        while (input.isEmptyLine()) {
            if (input.nextLine() === null) {
                return null;
            }
        }
        let stateChange = new StateChange(input.currentPoint, Paragraph.name);
        stateChange.references = state.references;
        stateChange.addBlockToken(
            BlockToken.createContentless("p", input.currentPoint, Paragraph.name, "open"),
        );
        do {
            for (const ruleObj of Paragraph.terminatedBy ?? []) {
                const otherStateChange = ruleObj.process(input, state);
                if (otherStateChange) {
                    stateChange.addBlockToken(
                        BlockToken.createContentless(
                            "p",
                            input.currentPoint,
                            Paragraph.name,
                            "close",
                        ),
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
            stateChange.addBlockToken(
                BlockToken.createText(input.currentPoint, Paragraph.name, line, 1),
            );
            containsText = true;
            if (input.trailingWhitespaces() >= 2) {
                stateChange.addBlockToken(
                    BlockToken.createSelfClosing(
                        "br",
                        input.currentPoint,
                        Paragraph.name,
                    ),
                );
            }
        } while (input.nextLine() != null);
        stateChange.addBlockToken(
            BlockToken.createContentless(
                "p",
                input.currentPoint,
                Paragraph.name,
                "close",
            ),
        );
        stateChange.endPoint = input.currentPoint;
        return stateChange;
    },
};