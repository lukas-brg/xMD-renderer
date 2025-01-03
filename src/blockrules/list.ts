import { leadingWhitespaces, isEmpty } from "../string_utils";
import { Token, BlockToken } from "../token";
import { MdInput } from "../mdinput";
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
    process: (input: MdInput, state: Readonly<ParsingState>) => {
        let [point, firstLine] = input.currentLineSkipWhiteSpace();

        if (!isUnorderedList(firstLine)) return null;

        let prevDepth = Math.floor((point.column - 1) / 2);
        const initialDepth = prevDepth;
        let depths = [initialDepth];

        let stateChange = new StateChange(input.currentPoint);

        stateChange.addBlockToken(
            BlockToken.createContentless("ul", input.currentPoint, "open", prevDepth),
        );

        let balance = 1;
        do {
            const [point, lineTrimmed] = input.currentLineSkipWhiteSpace();
            if (!isUnorderedList(lineTrimmed)) break;
            const spaces = point.column - 1;
            const depth = Math.floor(spaces / 2);

            if (depth > prevDepth) {
                stateChange.addBlockToken(
                    BlockToken.createContentless(
                        "ul",
                        input.currentPoint,
                        "open",
                        prevDepth,
                    ),
                );
                balance++;
                depths.push(depth);
            } else if (depth < prevDepth) {
                while (depths.length > 1) {
                    let topDepth = depths.pop() ?? 0; // 0 case should be unreachable
                    if (topDepth >= depth) {
                        stateChange.addBlockToken(
                            BlockToken.createContentless(
                                "ul",
                                input.currentPoint,
                                "close",
                                prevDepth,
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
        } while (input.nextLine());

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

        return stateChange;
    },
};
