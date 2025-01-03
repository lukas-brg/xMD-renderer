import { leadingWhitespaces, isEmpty } from "../string_utils";
import { Token, BlockToken } from "../token";
import { InputState } from "../input_state";
import { ParsingState, StateChange } from "../parser";
import BlockRule from "./blockrule";

export const Paragraph: BlockRule = {
    name: "paragraph",
    process: (input: InputState, state: Readonly<ParsingState>) => {
        let stateChange = new StateChange(input.currentPoint, Paragraph.name);

        let line = input.currentLine();
        stateChange.addBlockToken(
            BlockToken.createContentless("p", input.currentPoint, "open"),
        );

        while (input.isEmptyLine()) {
            let _ = input.nextLine();
        }
        do {
            for (const ruleObj of Paragraph.terminatedBy ?? []) {
                const otherStateChange = ruleObj.process(input, state);
                if (otherStateChange) {
                    stateChange.addBlockToken(
                        BlockToken.createContentless("p", input.currentPoint, "close"),
                    );
                    stateChange.merge(otherStateChange);
                    return stateChange;
                }
            }

            if (input.isEmptyLine()) {
                break;
            }

            let line = input.currentLine();
            stateChange.addBlockToken(
                BlockToken.createWrapped("text", input.currentPoint, line, 1),
            );

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
