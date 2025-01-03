import { leadingWhitespaces, isEmpty } from "../string_utils";
import { Token, BlockToken } from "../token";
import { InputState } from "../input_state";
import { ParsingState, StateChange } from "../parser";
import BlockRule from "./blockrule";
import { assert } from "console";

function isUnorderedList(line: string): boolean {
    if (line.startsWith("- ") || line.startsWith("* ") || line.startsWith("+ ")) {
        return true;
    }
    return false;
}

export const UnorderedList: BlockRule = {
    name: "unordered_list",
    process: (input: InputState, state: Readonly<ParsingState>) => {
        let [point, firstLine] = input.currentLineSkipWhiteSpace();

        if (!isUnorderedList(firstLine)) return null;

        let prevDepth = Math.floor((point.column - 1) / 2);
        const initialDepth = prevDepth;
        let depths = [initialDepth];

        let stateChange = new StateChange(input.currentPoint, UnorderedList.name);

        stateChange.addBlockToken(
            BlockToken.createContentless("ul", input.currentPoint, "open", prevDepth),
        );
        let line;
        let balance = 1;
        do {
            const [point, lineTrimmed] = input.currentLineSkipWhiteSpace();
            if (!isUnorderedList(lineTrimmed)) {
                console.log(point, lineTrimmed);
                break;
            }
            const spaces = point.column - 1;
            const depth = Math.floor(spaces / 2);

            if (depth > prevDepth) {
                stateChange.addBlockToken(
                    BlockToken.createContentless("ul", input.currentPoint, "open", depth),
                );
                balance++;
                depths.push(depth);
            } else if (depth < prevDepth) {
                while (depths.length > 1) {
                    const poppedDepth = depths.pop();
                    assert(poppedDepth != undefined);
                    const topDepth = poppedDepth ?? 0; // 0 case should be unreachable
                    if (topDepth >= depth) {
                        stateChange.addBlockToken(
                            BlockToken.createContentless(
                                "ul",
                                input.currentPoint,
                                "close",
                                topDepth,
                            ),
                        );
                        balance--;
                    } else if (topDepth <= depth) {
                        break;
                    }
                }
            }
            const content = lineTrimmed.slice(2);
            stateChange.addBlockToken(
                BlockToken.createWrapped("li", point, content, depth),
            );
            prevDepth = depth;
            console.log("list, ", input.currentLine());
        } while ((line = input.nextLine()) != null);

        assert(balance == 1);
        for (let i = 0; i < depths.length; i++) {
            stateChange.addBlockToken(
                BlockToken.createContentless(
                    "ul",
                    input.currentPoint,
                    "close",
                    prevDepth,
                ),
            );
            balance--;
        }
        assert(balance == 0, balance);
        stateChange.endPoint = input.currentPoint;
        return stateChange;
    },
};
