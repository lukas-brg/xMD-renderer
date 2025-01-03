import { leadingWhitespaces, isEmpty } from "../string_utils";
import { Token, BlockToken } from "../token";
import { MdInput } from "../mdinput";
import { ParsingState } from "../parser";
import BlockRule from "./blockrule";

export const Paragraph: BlockRule = {
    process: (input: MdInput, state: Readonly<ParsingState>) => {
        return null;
    },
};
