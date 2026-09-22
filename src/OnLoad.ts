import { StatusBarItem, workspace } from "vscode";
import { FileSystem } from "./FileSystem";
import { SizeScanner } from "./SizeScanner";
import { setError, setMessage } from "./Status";
import { EXTENSION_ID } from "./extension";
export class OnLoad {
    public static update(status: StatusBarItem, scanner: SizeScanner) {
        console.log("UPDATE: running...");
        const subscriptions = [
            scanner.onDidComplete(result => {
                const config = workspace.getConfiguration(EXTENSION_ID);
                const decimals = <number>config.get("decimal");
                setMessage(status, FileSystem.formatBytes(result.bytes, decimals));
                subscriptions.forEach(subscription => subscription.dispose());
            }),
            scanner.onDidError(error => {
                setError(status, error.message);
                subscriptions.forEach(subscription => subscription.dispose());
            }),
        ];
        scanner.start();
    }
}
