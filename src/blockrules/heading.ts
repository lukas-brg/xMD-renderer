import { InputState } from "../input_state";
import { ParsingStateBlock, StateChange } from "../parser";
import { BlockToken, Token } from "../token";
import BlockRule from "./blockrule";
import { leadingWhitespaces, isEmpty } from "../string_utils";

export const Heading: BlockRule = {
    name: "heading",

    process: (input: InputState, state: Readonly<ParsingStateBlock>) => {
        let tokens = new Array<Token>();
        let stateChange = new StateChange(input.currentPoint, Heading.name);
        const headingTypes: { [key: string]: string } = {
            "#": "h1",
            "##": "h2",
            "###": "h3",
            "####": "h4",
            "#####": "h5",
            "######": "h6",
        };

        if (input.isEmptyLine(-1)) {
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
        stateChange.endPoint = input.currentPoint;
        return stateChange;
    },
};

// export default Heading;
