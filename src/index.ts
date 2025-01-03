import { InputState } from "./input_state";
import { parse } from "./parser";

function renderFile(filePath: string) {
    let doc = InputState.fromFile(filePath);
    parse(doc);
}

renderFile("test.md");
