import { statSync } from "fs";
import * as vscode from "vscode";
export class FileSystem {
    public static async getBytes() : Promise<number> {
        let size = 0;
        let files = await FileSystem.getAllFiles();
        if(files.length <= 0) {
            return Promise.reject(new Error("No files found."));
        }
        for(let file of files) {
            const stat = statSync(file.fsPath);
            size += stat.size;
        }
        return Promise.resolve(size);
    } 
    public static async getAllFiles(): Promise<vscode.Uri[]> {
        let folders = vscode.workspace.workspaceFolders;
        if(!folders) {
            return Promise.resolve([]);
        } else {
            let allFiles = [];
            for(let folder of folders) {
                let pattern = new vscode.RelativePattern(folder, "**/*.*");
                let files = await vscode.workspace.findFiles(pattern);
                if(!files) {
                    Promise.resolve([]);
                }
                allFiles.push(...files);
            }
            return Promise.resolve(allFiles);
        }
    }

    public static formatBytes(bytes: number, decimals: number): string {
        if (!+bytes) {return "0 Bytes";}
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }
}