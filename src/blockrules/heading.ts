import { MdInput } from "../mdinput";
import { ParsingState, StateChange } from "../parser";
import { BlockToken, Token } from "../token";
import BlockRule from "./blockrule";
import { leadingWhitespaces, isEmpty } from "../string_utils";

export const Heading: BlockRule = {
    process: (input: MdInput, state: Readonly<ParsingState>) => {
        let tokens = new Array<Token>();
        let stateChange = new StateChange(input.currentPoint);
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
            return null;
        }
        const line = input.currentLine();
        const [heading, remainingLine] = line.split(/\s+/, 2);
        if (!heading || !remainingLine) {
            return null;
        }
        const headingTag = headingTypes[heading];

        if (!headingTag) return null;
        stateChange.addBlockToken(
            BlockToken.createWrapped(headingTag, input.currentPoint, remainingLine),
        );

        return stateChange;
    },
};

// export default Heading;
