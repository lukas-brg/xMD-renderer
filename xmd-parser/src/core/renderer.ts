import { BlockToken, Token } from "./token.js";
import { InlineToken } from "./token.js";
import * as fs from "fs";
import { readFile } from "./string_utils.js";
import { ParsingStateBlock } from "./parsing_state.js";
import { Dict } from "./util.js";

function attrStr(token: Token): string {
    const attrs = [...token.attributes.entries()]
        .map(([k, v]) => ` ${k}="${v}"`)
        .join("");
    return attrs;
}

function renderInline(tokens: InlineToken[]) {
    let html = tokens
        .map((token) => {
            switch (token.tagKind) {
                case "text":
                    return `${token.content}`;
                case "open":
                    return `<${token.tag}${attrStr(token)}>`;
                case "wrapped":
                    return `<${token.tag}${attrStr(token)}>${token.content}</${token.tag}>`;
                case "selfClosing":
                    return `<${token.tag}${attrStr(token)}/>`;
                case "close":
                    return `</${token.tag}>`;
                default:
                    return "";
            }
        })
        .join("");
    return html;
}

export function renderHTML(tokens: BlockToken[]): string {
    const indent = (depth: number) => "  ".repeat(depth);

    let html = tokens
        .map((token) => {
            let inCodeBlock = token.tag == "pre" || token.tag == "code";
            let indentation = indent(token.depth + 1); // every element is child of body
            let sep = "\n";
            let content = renderInline(token.inlineTokens);
            if (inCodeBlock) {
                indentation = "";
                sep = "";
            }
            switch (token.tagKind) {
                case "text":
                    return `${content}` + sep;
                case "open":
                    return `${indentation}<${token.tag}${attrStr(token)}>` + sep;
                case "wrapped":
                    return (
                        `${indentation}<${token.tag}${attrStr(token)}>${content}</${token.tag}>` +
                        sep
                    );
                case "selfClosing":
                    return `${indentation}<${token.tag}${attrStr(token)}/>` + sep;
                case "close":
                    return `${indentation}</${token.tag}>` + sep;
                default:
                    return "";
            }
        })
        .join("");

    return html;
}

export function render(state: ParsingStateBlock): string {
    let html = [];
    for (let [ruleName, tokens] of state.appliedTokens) {
        html.push(renderHTML(tokens));
    }
    return html.join("");
}



export function renderMarkdownBody(state: ParsingStateBlock) {
    const htmlContent = render(state);
    return `
    <div class="markdown-body">
    ${htmlContent}
    </div>
    `
}

export function renderToHtmlStr(state: ParsingStateBlock) {
    const htmlContent = render(state);
    const theme = readFile("./static/github-markdown.css");
    const marginStyle = readFile("./static/margin.css");
    const htmlSkeleton = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://esm.sh/@wooorm/starry-night@3/style/both">
    <script type="module">
    </script>
    <title>Markdown Output</title>
</head>
<body class="markdown-body">
${htmlContent}
<style>
${theme}
${marginStyle}
</style>
<script>

</script>
</body>
</html>
    `;
return htmlSkeleton
}

export function renderToFile(state: ParsingStateBlock, filePath: string) {

    fs.writeFileSync(filePath, renderToHtmlStr(state), "utf8");
}
