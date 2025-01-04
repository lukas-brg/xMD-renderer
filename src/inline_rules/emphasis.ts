import { ParsingStateInline } from "../parser";
import InlineRule from "./inline_rule";
import { InlineToken } from "../token";

export const Emphasis: InlineRule = {
    name: "emphasis",

    process: (state: ParsingStateInline) => {
        return false;
    },
};
