import { assert } from "console";
import { BlockToken } from "./token";
import { InlineToken } from "./token";
import * as fs from "fs";

function renderInline(tokens: InlineToken[]) {
    let html = tokens
        .map((token) => {
            switch (token.tagKind) {
                case "text":
                    return `${token.content}`;
                case "open":
                    return `<${token.tag}>`;
                case "wrapped":
                    return `<${token.tag}>${token.content}</${token.tag}>`;
                case "selfClosing":
                    return `<${token.tag}/>`;
                case "close":
                    return `</${token.tag}>`;
                default:
                    return "";
            }
        })
        .join("");
    return html;
}

function renderHTML(tokens: BlockToken[]): string {
    const indent = (depth: number) => "  ".repeat(depth);

    let html = tokens
        .map((token) => {
            const indentation = indent(token.depth);
            let content = renderInline(token.inlineTokens);
            switch (token.tagKind) {
                case "text":
                    return `${content}`;
                case "open":
                    return `${indentation}<${token.tag}>`;
                case "wrapped":
                    return `${indentation}<${token.tag}>${content}</${token.tag}>`;
                case "selfClosing":
                    return `${indentation}<${token.tag}/>`;
                case "close":
                    return `${indentation}</${token.tag}>`;
                default:
                    return "";
            }
        })
        .join("\n");

    return html;
}

export function renderToFile(tokens: BlockToken[], filePath: string) {
    const htmlContent = renderHTML(tokens);

    const htmlSkeleton = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Markdown Output</title>
</head>
<body>
    ${htmlContent}
</body>
</html>
    `;

    fs.writeFileSync(filePath, htmlSkeleton, "utf8");
}
