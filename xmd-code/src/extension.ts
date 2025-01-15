import * as vscode from 'vscode';
import { renderMarkdown } from 'xmd-parser/src/core';

export function activate(context: vscode.ExtensionContext) {
    let panel: vscode.WebviewPanel | undefined = undefined;

    const disposable = vscode.commands.registerCommand('xmd-code.showMarkdown', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const markdownContent = editor.document.getText();

            if (!panel) {
                panel = vscode.window.createWebviewPanel(
                    'markdownPreview',
                    'Markdown Preview', 
                    vscode.ViewColumn.Beside, 
                    {
                        enableScripts: true, 
                    }
                );
            }

            panel.webview.html = renderMarkdown(markdownContent);
        } else {
            vscode.window.showErrorMessage('No active editor found!');
        }
    });

    vscode.workspace.onDidChangeTextDocument((event) => {
        if (panel && vscode.window.activeTextEditor) {
            const editor = vscode.window.activeTextEditor;

            if (event.document === editor.document) {
                const markdownContent = editor.document.getText();
                panel.webview.html = renderMarkdown(markdownContent);
            }
        }
    });

    context.subscriptions.push(disposable);
}