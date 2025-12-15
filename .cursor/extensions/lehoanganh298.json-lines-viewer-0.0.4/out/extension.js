"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const fs_1 = require("fs");
const readline_1 = require("readline");
const jsonlScheme = 'jsonl';
let lineIndexDict = Object(); // Store current line index of previewed json files
let lineIdxStatusBarItem;
// A custom content provider for jsonl file
class JsonlContentProvider {
    constructor() {
        this.onDidChangeEmitter = new vscode.EventEmitter();
        this.onDidChange = this.onDidChangeEmitter.event;
    }
    async provideTextDocumentContent(uri) {
        let lineIdx = lineIndexDict[uri.path];
        if (lineIdx === undefined) {
            lineIdx = 1;
            lineIndexDict[uri.path] = lineIdx;
        }
        const res = await readFileAtLine(uri, lineIdx);
        lineIndexDict[uri.path] = res[1]; // handle when line index invalid
        updateLineIdxStatusBarItem();
        const lineFormated = JSON.stringify(JSON.parse(res[0]), null, 2);
        return lineFormated;
    }
}
;
const jsonlProvider = new JsonlContentProvider();
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(jsonlScheme, jsonlProvider));
    context.subscriptions.push(vscode.commands.registerCommand('json-lines-viewer.preview', openPreviewHandler));
    context.subscriptions.push(vscode.commands.registerCommand('json-lines-viewer.next-line', nextLineHandler));
    context.subscriptions.push(vscode.commands.registerCommand('json-lines-viewer.previous-line', previousLineHandler));
    context.subscriptions.push(vscode.commands.registerCommand('json-lines-viewer.go-to-line', goToLine));
    lineIdxStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100000);
    context.subscriptions.push(lineIdxStatusBarItem);
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(updateLineIdxStatusBarItem));
    updateLineIdxStatusBarItem();
}
exports.activate = activate;
// Read a file content at specified line index
// If line index <=0, return first line
// If line index exceed file's line count, return last line
// Input: 	- file's uri
// 			- line index
// Output: 	- line's content
// 			- returned line index
async function readFileAtLine(uri, lineIdx) {
    if (lineIdx <= 0) {
        lineIdx = 1;
    }
    const fileStream = (0, fs_1.createReadStream)(uri.path.replace('(preview)', '').trimEnd());
    const rl = (0, readline_1.createInterface)({
        input: fileStream,
        crlfDelay: Infinity
    });
    // Note: we use the crlfDelay option to recognize all instances of CR LF
    // ('\r\n') in input.txt as a single line break.
    // TODO: not having to iterate from the begining of file every time
    let idx = 0;
    let line = '';
    for await (line of rl) {
        idx += 1;
        if (idx === lineIdx) {
            return [line, idx];
        }
    }
    return [line, idx];
}
const openPreviewHandler = async (arg) => {
    let uri = arg;
    if (!(uri instanceof vscode.Uri)) {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor && activeEditor.document.languageId === 'jsonl') {
            uri = activeEditor.document.uri;
        }
        else {
            vscode.window.showInformationMessage("Open a JSON Lines file (.jsonl) first to show a preview.");
            return;
        }
    }
    // Change uri-scheme to "jsonl"
    let uriPath = "";
    if (uri._fsPath !== undefined && uri._fsPath !== null) {
        uriPath = uri._fsPath;
    }
    else {
        uriPath = uri.path;
    }
    const jsonlUri = vscode.Uri.parse('jsonl:' + uriPath + ' (preview)');
    const document = await vscode.workspace.openTextDocument(jsonlUri);
    await vscode.window.showTextDocument(document);
    await vscode.languages.setTextDocumentLanguage(document, "json");
};
const nextLineHandler = async () => {
    if (!vscode.window.activeTextEditor) {
        return; // no editor
    }
    const { document } = vscode.window.activeTextEditor;
    if (document.uri.scheme !== jsonlScheme) {
        return; // not my scheme
    }
    lineIndexDict[document.uri.path] += 1;
    jsonlProvider.onDidChangeEmitter.fire(document.uri);
};
const previousLineHandler = async () => {
    if (!vscode.window.activeTextEditor) {
        return; // no editor
    }
    const { document } = vscode.window.activeTextEditor;
    if (document.uri.scheme !== jsonlScheme) {
        return; // not my scheme
    }
    lineIndexDict[document.uri.path] -= 1;
    jsonlProvider.onDidChangeEmitter.fire(document.uri);
};
const goToLine = async () => {
    if (!vscode.window.activeTextEditor) {
        return; // no editor
    }
    const { document } = vscode.window.activeTextEditor;
    if (document.uri.scheme !== jsonlScheme) {
        return; // not my scheme
    }
    let lineIdx = null;
    while (lineIdx === null || isNaN(lineIdx)) {
        let lineIdxStr = await vscode.window.showInputBox({ prompt: 'Type a line number to preview Json object at that line.' });
        if (lineIdxStr === undefined) {
            break;
        }
        lineIdx = parseInt(lineIdxStr);
    }
    if (lineIdx !== null) {
        lineIndexDict[document.uri.path] = lineIdx;
        jsonlProvider.onDidChangeEmitter.fire(document.uri);
    }
};
function updateLineIdxStatusBarItem() {
    if (!vscode.window.activeTextEditor) {
        lineIdxStatusBarItem.hide(); // no editor
        return;
    }
    const { document } = vscode.window.activeTextEditor;
    if (document.uri.scheme !== jsonlScheme) {
        lineIdxStatusBarItem.hide();
        return;
    }
    lineIdxStatusBarItem.text = `JSONL at line: ${lineIndexDict[document.uri.path]}`;
    lineIdxStatusBarItem.show();
}
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map