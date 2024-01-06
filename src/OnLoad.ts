import { StatusBarItem, workspace } from "vscode";
import { FileSystem } from "./FileSystem";
import { setError, setMessage } from "./Status";
import { EXTENSION_ID } from "./extension";
export class OnLoad {
    public static async update(status: StatusBarItem) {
        console.log("UPDATE: running...");
        FileSystem.getBytes().then(bytes => {
            const config = workspace.getConfiguration(EXTENSION_ID);
            const decimals = <number>config.get("decimal");
            setMessage(status, FileSystem.formatBytes(bytes, decimals));
        }).catch(error => {
            setError(status, error);
        });
    }
}