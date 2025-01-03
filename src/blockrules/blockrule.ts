import { MdInput } from "../mdinput";
import { ParsingState, StateChange } from "../parser";

export default interface BlockRule {
    process: (input: MdInput, state: Readonly<ParsingState>) => StateChange | null;
    before?: (input: MdInput) => void;
    after?: (input: MdInput) => void;
}
