import { ParsingStateInline } from "../parser";

export default interface InlineRule {
    process: (state: ParsingStateInline) => boolean;
    name: string;
}
