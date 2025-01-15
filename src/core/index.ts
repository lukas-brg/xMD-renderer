import { InputState } from "./input_state.js";
import { parse } from "./parser.js";
import { render, renderToFile } from "./renderer.js";

export function renderFile(filePath: string, outFilePath: string) {
    let doc = InputState.fromFile(filePath);
    let state = parse(doc);

    renderToFile(state, outFilePath);
}
