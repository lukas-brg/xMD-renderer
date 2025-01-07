import { InputState } from "../input_state.js";
import { ParsingStateBlock, StateChange } from "../parsing_state.js";

export default interface BlockRule {
    process: (
        input: InputState,
        state: Readonly<ParsingStateBlock>,
        stateChange: StateChange,
    ) => boolean;
    before?: (input: InputState) => void;
    after?: (input: InputState) => void;
    name: string;
    terminatedBy?: BlockRule[];
}
