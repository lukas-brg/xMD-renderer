import { InputState } from "./input_state.js";
import { parse } from "./parser.js";
import { ParsedBlock } from "./parsing_state.js";
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

export function parseGetBlocks(input: InputState): ParsedBlock[] {
    let state = parse(input);
    return state.blocks;
}

export { renderFromBlocks } from "./renderer.js";
