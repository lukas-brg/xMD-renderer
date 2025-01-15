import { InputState } from "./input_state.js";
import { parse } from "./parser.js";
import { render, renderMarkdownBody, renderToFile, renderToHtmlStr } from "./renderer.js";

export function renderFile(filePath: string, outFilePath: string) {
    let doc = InputState.fromFile(filePath);
    let state = parse(doc);

    renderToFile(state, outFilePath);
}

export function renderMarkdown(content: string): string {
    let doc = InputState.fromString(content);
    let state = parse(doc);
    return renderMarkdownBody(state);
}