import { InputState } from "./input_state.js";
import { parse } from "./parser.js";
import { renderToFile } from "./renderer.js";

function renderFile(filePath: string) {
    let doc = InputState.fromFile(filePath);
    let state = parse(doc);
    renderToFile(state.blockTokens, "test.html");
}

renderFile("test.md");
