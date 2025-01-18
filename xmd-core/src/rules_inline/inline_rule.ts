import { ParsingStateInline } from "../parsing_state.js";

export default interface InlineRule {
    process: (state: ParsingStateInline) => boolean;
    name: string;
}
