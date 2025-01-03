import { InputState } from "../input_state";
import { ParsingState, StateChange } from "../parser";

export default interface BlockRule {
    /**
     * Processes the input and returns a `StateChange` object or `null`.
     *
     * - If the rule is successfully applied, the method returns a `StateChange` object reflecting the state modifications.
     * - If the rule is immediately determined to not apply, the method returns `null`, avoiding unnecessary overhead.
     * - If the rule fails midway it returns a `StateChange` object inidcating the failure and including all the state changes up to the point of failure.
     */
    process: (input: InputState, state: Readonly<ParsingState>) => StateChange | null;
    before?: (input: InputState) => void;
    after?: (input: InputState) => void;
    name: string;
    terminatedBy?: BlockRule[];
}
