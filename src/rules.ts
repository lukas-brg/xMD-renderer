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
            new BlockToken(headingTag, remainingLine, input.currentPoint),
        );

        return true;
    },
};

export const UnorderedList: BlockRule = {
    process: (input: MdInput, state: ParsingState) => {
        const line = input.currentLine();
        if (!(line.startsWith("-") || line.startsWith("*") || line.startsWith("+"))) {
            return false;
        }

        return true;
    },
};
