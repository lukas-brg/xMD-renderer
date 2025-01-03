import { InputState } from "./input_state";
import { parse } from "./parser";
import { renderToFile } from "./renderer";

function renderFile(filePath: string) {
    let doc = InputState.fromFile(filePath);
    let state = parse(doc);
    renderToFile(state.tokens, "test.html");
}

renderFile("test.md");
