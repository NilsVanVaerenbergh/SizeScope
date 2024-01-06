import * as vscode from 'vscode';
import { OnLoad } from './OnLoad';

export const EXTENSION_ID = "sizescope";
export function activate(context: vscode.ExtensionContext) {
	let status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right,-1);
	OnLoad.update(status);
	status.show();
	vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
		if(document.uri.scheme === "file") {
			OnLoad.update(status);
		}
	});
	vscode.workspace.onDidOpenTextDocument((document : vscode.TextDocument) => {
		status.tooltip = `Currently in: ${document.fileName}`;
	});
	vscode.workspace.onDidChangeConfiguration(() => {
		OnLoad.update(status);
	});
	status.command = "workbench.files.action.showActiveFileInExplorer";
}
export function deactivate() {
}
