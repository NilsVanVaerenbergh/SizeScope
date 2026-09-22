import * as vscode from "vscode";
import { Worker } from "worker_threads";
import { FileSystem } from "./FileSystem";

export interface ScanProgress {
    filesScanned: number;
    totalFiles: number;
    bytes: number;
}

export interface ScanResult {
    bytes: number;
    filesScanned: number;
}

/**
 * Computes total project size off the extension host's main thread using a
 * worker_thread, so callers never block on the result. Subscribe to the
 * onDid* events instead of awaiting start().
 */
export class SizeScanner implements vscode.Disposable {
    private readonly _onDidProgress = new vscode.EventEmitter<ScanProgress>();
    private readonly _onDidComplete = new vscode.EventEmitter<ScanResult>();
    private readonly _onDidError = new vscode.EventEmitter<Error>();

    public readonly onDidProgress = this._onDidProgress.event;
    public readonly onDidComplete = this._onDidComplete.event;
    public readonly onDidError = this._onDidError.event;

    private activeWorker: Worker | undefined;
    // Bumped on every start()/cancel() so late messages from a superseded
    // scan are ignored instead of firing events for stale work.
    private scanToken = 0;

    public constructor(private readonly workerScriptPath: string) {}

    /** Kicks off a scan in the background. Does not wait for completion. */
    public start(): void {
        this.cancel();
        const token = this.scanToken;
        this.runScan(token).catch((error: unknown) => {
            if (token === this.scanToken) {
                this._onDidError.fire(error instanceof Error ? error : new Error(String(error)));
            }
        });
    }

    /** Cancels any in-flight scan, terminating its worker thread immediately. */
    public cancel(): void {
        this.scanToken++;
        const worker = this.activeWorker;
        this.activeWorker = undefined;
        if (worker) {
            void worker.terminate();
        }
    }

    public dispose(): void {
        this.cancel();
        this._onDidProgress.dispose();
        this._onDidComplete.dispose();
        this._onDidError.dispose();
    }

    private async runScan(token: number): Promise<void> {
        const files = await FileSystem.getAllFiles();
        if (token !== this.scanToken) {
            return; // superseded or cancelled while enumerating files
        }
        if (files.length === 0) {
            this._onDidError.fire(new Error("No files found."));
            return;
        }

        const worker = new Worker(this.workerScriptPath, {
            workerData: { paths: files.map(file => file.fsPath) },
        });
        this.activeWorker = worker;

        worker.on("message", (message: { type: string; filesScanned: number; totalFiles?: number; bytes: number; message?: string }) => {
            if (token !== this.scanToken) {
                return;
            }
            switch (message.type) {
                case "progress":
                    this._onDidProgress.fire({ filesScanned: message.filesScanned, totalFiles: message.totalFiles ?? 0, bytes: message.bytes });
                    break;
                case "done":
                    this._onDidComplete.fire({ bytes: message.bytes, filesScanned: message.filesScanned });
                    break;
                case "error":
                    this._onDidError.fire(new Error(message.message ?? "Unknown scan error."));
                    break;
            }
        });
        worker.on("error", (error: Error) => {
            if (token === this.scanToken) {
                this._onDidError.fire(error);
            }
        });
        worker.on("exit", () => {
            if (this.activeWorker === worker) {
                this.activeWorker = undefined;
            }
        });
    }
}
