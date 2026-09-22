import * as vscode from 'vscode';
import * as path from 'path';
import { OnLoad } from './OnLoad';
import { SizeScanner } from './SizeScanner';

export const EXTENSION_ID = "sizescope";
export function activate(context: vscode.ExtensionContext) {
	let status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right,-1);
	const scanner = new SizeScanner(path.join(__dirname, 'sizeWorker.js'));
	context.subscriptions.push(scanner);

	OnLoad.update(status, scanner);
	status.show();
	vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
		if(document.uri.scheme === "file") {
			OnLoad.update(status, scanner);
		}
	});
	vscode.workspace.onDidOpenTextDocument((document : vscode.TextDocument) => {
		status.tooltip = `Currently in: ${document.fileName}`;
	});
	vscode.workspace.onDidChangeConfiguration(() => {
		OnLoad.update(status, scanner);
	});
	status.command = "workbench.files.action.showActiveFileInExplorer";
}
export function deactivate() {
}
