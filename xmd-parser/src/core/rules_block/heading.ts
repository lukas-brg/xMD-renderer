import { InputState } from "../input_state.js";
import { ParsingStateBlock, StateChange } from "../parsing_state.js";
import { BlockToken, Token } from "../token.js";
import BlockRule from "./blockrule.js";

export const Heading: BlockRule = {
    name: "heading",

    process: (
        input: InputState,
        state: Readonly<ParsingStateBlock>,
        stateChange: StateChange,
    ) => {
        const headingTypes: { [key: string]: string } = {
            "#": "h1",
            "##": "h2",
            "###": "h3",
            "####": "h4",
            "#####": "h5",
            "######": "h6",
        };

        if (!input.isEmptyLine(-1)) {
            return false;
        }
        const line = input.currentLine();
        const [heading, remainingLine] = line.split(/\s+(.+)/, 2);
        if (!heading || !remainingLine) {
            return false;
        }
        const headingTag = headingTypes[heading];

        if (!headingTag) return false;
        const token = BlockToken.createWrapped(
            headingTag,
            input.currentPoint,
            Heading.name,
            remainingLine,
        );
        stateChange.addBlockToken(token);
        const lvl = Number.parseInt(headingTag.substring(1));
        stateChange.registerHeading(remainingLine, lvl, input.currentPoint.line, token);

        stateChange.endPoint = input.currentPoint;
        input.nextLine();
        return true;
    },
};

// export default Heading;
