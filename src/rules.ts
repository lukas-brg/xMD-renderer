import { leadingWhitespaces, isEmpty } from "./string_util";
import { Token, BlockToken } from "./token";
import { MdInput } from "./mdinput";
import { ParsingState } from "./parser";

export interface BlockRule {
    process: (input: MdInput, state: ParsingState) => boolean;
    before?: (input: MdInput) => void;
    after?: (input: MdInput) => void;
}

export const Heading: BlockRule = {
    process: (input: MdInput, state: ParsingState) => {
        const headingTypes: { [key: string]: string } = {
            "#": "h1",
            "##": "h2",
            "###": "h3",
            "####": "h4",
            "#####": "h5",
            "######": "h6",
        };
        const prevLine = input.previousLine();
        if (prevLine != null && !isEmpty(prevLine)) {
            return false;
        }
        const line = input.currentLine();
        const [heading, remainingLine] = line.split(/\s+/, 2);
        if (!heading || !remainingLine) {
            return false;
        }
        const headingTag = headingTypes[heading];

        if (!headingTag) return false;
        state.addBlockToken(
            BlockToken.createWrapped(headingTag, input.currentPoint, remainingLine),
        );

        return true;
    },
};

function isUnorderedList(line: string): boolean {
    if (line.startsWith("- ") || line.startsWith("* ") || line.startsWith("+ ")) {
        return true;
    }
    return false;
}

export const UnorderedList: BlockRule = {
    process: (input: MdInput, state: ParsingState) => {
        let [point, firstLine] = input.currentLineSkipWhiteSpace();
        let prevDepth = Math.floor((point.column - 1) / 2);
        if (!isUnorderedList(firstLine)) return false;

        state.addBlockToken(
            BlockToken.createContentless("ul", input.currentPoint, "open", prevDepth),
        );
        do {
            const [point, lineTrimmed] = input.currentLineSkipWhiteSpace();
            if (!isUnorderedList(lineTrimmed)) break;
            const spaces = point.column - 1;
            const depth = Math.floor(spaces / 2);
            if (depth > prevDepth) {
                state.addBlockToken(
                    BlockToken.createContentless(
                        "ul",
                        input.currentPoint,
                        "open",
                        prevDepth,
                    ),
                );
            } else if (depth < prevDepth) {
                state.addBlockToken(
                    BlockToken.createContentless(
                        "ul",
                        input.currentPoint,
                        "close",
                        prevDepth,
                    ),
                );
            }
            const content = lineTrimmed.slice(2);
            state.addBlockToken(BlockToken.createWrapped("li", point, content, depth));
            prevDepth = depth;
        } while (input.nextLine());

        state.addBlockToken(
            BlockToken.createContentless("ul", input.currentPoint, "close", prevDepth),
        );
        return true;
    },
};
