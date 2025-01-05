import { ParsingStateInline } from "../parser.js";

export default interface InlineRule {
    process: (state: ParsingStateInline) => boolean;
    name: string;
}
