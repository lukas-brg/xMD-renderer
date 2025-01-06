import { InputState } from "../input_state.js";
import { ParsingStateBlock, StateChange } from "../parsing_state.js";
import { BlockToken, Token } from "../token.js";
import BlockRule from "./blockrule.js";
import { HeadingForm } from "../parsing_state.js";

export const Heading: BlockRule = {
    name: "heading",

    process: (input: InputState, state: Readonly<ParsingStateBlock>) => {
        let stateChange = new StateChange(input.currentPoint, Heading.name);
        const headingTypes: { [key: string]: string } = {
            "#": "h1",
            "##": "h2",
            "###": "h3",
            "####": "h4",
            "#####": "h5",
            "######": "h6",
        };

        if (!input.isEmptyLine(-1)) {
            return null;
        }
        const line = input.currentLine();
        const [heading, remainingLine] = line.split(/\s+(.+)/, 2);
        if (!heading || !remainingLine) {
            return null;
        }
        const headingTag = headingTypes[heading];

        if (!headingTag) return null;
        stateChange.addBlockToken(
            BlockToken.createWrapped(headingTag, input.currentPoint, remainingLine),
        );
        const lvl = Number.parseInt(headingTag.substring(1));
        stateChange.registerHeading({
            text: remainingLine,
            level: lvl,
            lineNumber: input.currentPoint.line,
        });

        stateChange.endPoint = input.currentPoint;
        return stateChange;
    },
};

// export default Heading;
