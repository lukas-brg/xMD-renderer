import * as vscode from "vscode";
import { renderMarkdown, parseGetBlocks, renderFromBlocks } from "xmd-parser/src/core";
import { ParsedBlock } from "xmd-parser/src/core/parsing_state";
import { IncrementalParser } from "xmd-parser/src/core/incremental_parser";
import { TextDocumentContentChangeEvent } from "vscode";
import { Range } from "xmd-parser/src/core/util";

function isChangeAfterLastBlock(
    change: TextDocumentContentChangeEvent,
    blocks: ParsedBlock[]
): boolean {
    if (blocks.length === 0) {
        return true;
    }

    const lastBlock = blocks[blocks.length - 1];
    return lastBlock.range.isBefore(change.range.start.line);
}

export function activate(context: vscode.ExtensionContext) {
    let panel: vscode.WebviewPanel | undefined = undefined;
    let parser: IncrementalParser = new IncrementalParser();

    const disposable = vscode.commands.registerCommand("xmd-code.showMarkdown", () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const markdownContent = editor.document.getText();

            if (!panel) {
                panel = vscode.window.createWebviewPanel(
                    "markdownPreview",
                    "Markdown Preview",
                    vscode.ViewColumn.Beside,
                    {
                        enableScripts: true,
                    }
                );
            }
            parser.parseAll(markdownContent);
            panel.webview.html = renderFromBlocks(parser.blocks);
        } else {
            vscode.window.showErrorMessage("No active editor found!");
        }
    });

    vscode.workspace.onDidChangeTextDocument((event) => {
        if (panel && vscode.window.activeTextEditor) {
            const editor = vscode.window.activeTextEditor;

            if (event.document === editor.document) {
                const changes = event.contentChanges;
                for (let change of changes) {
                    const lastBlock = parser.lastBlock;
                    console.log("editor", editor.document.getText());
                    if (!lastBlock) {
                        parser.parseAll(editor.document.getText());
                        panel.webview.html = renderFromBlocks(parser.blocks);
                        continue;
                    }
                    if (lastBlock.range.containsOpen(change.range.start.line)) {
                        editor.document.lineCount;
                        const start = lastBlock.range.start;

                        const end = editor.document.lineCount - 1;
                        const range = new vscode.Range(
                            start,
                            0,
                            end,
                            editor.document.lineAt(end).text.length
                        );

                        const content = editor.document.getText(range);
                        const updatedBlocks = parser.update([content, lastBlock]);
                        console.log(updatedBlocks);
                        panel.webview.html = renderFromBlocks(parser.blocks);
                    } else {
                        parser.parseAll(editor.document.getText());
                        panel.webview.html = renderFromBlocks(parser.blocks);
                    }
                }
            }
        }
    });

    context.subscriptions.push(disposable);
}
