import {
    DeferredState,
    DeferredTokenStateEntry,
    ParsingStateInline,
} from "../parsing_state.js";
import { RuleState } from "../rules.js";

export default interface InlineRule {
    process: (state: ParsingStateInline, ruleState: RuleState) => boolean;
    name: string;
}
