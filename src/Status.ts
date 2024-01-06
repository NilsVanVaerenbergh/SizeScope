import { StatusBarItem, ThemeColor } from "vscode";

export const setError = (statusItem: StatusBarItem, message: string) => {
    statusItem.color = "ffffff";
    statusItem.backgroundColor = new ThemeColor("statusBarItem.errorBackground");
    statusItem.tooltip = "Oh no I oop. No files";
    statusItem.text = "$(x) " + message;
};
export const setMessage = (statusItem: StatusBarItem, message: string) => {
    statusItem.color = "ffffff";
    statusItem.backgroundColor = new ThemeColor("statusBarItem.warningBackground");
    statusItem.text = "$(folder) " + message;
};