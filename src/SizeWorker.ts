import { parentPort, workerData } from "worker_threads";
import { promises as fs } from "fs";

interface WorkerInput {
    paths: string[];
}

const CONCURRENCY = 32;

async function run(): Promise<void> {
    const { paths } = workerData as WorkerInput;
    const total = paths.length;
    const progressStep = Math.max(1, Math.floor(total / 20));

    let bytes = 0;
    let filesScanned = 0;
    let nextIndex = 0;

    async function scanLane(): Promise<void> {
        while (nextIndex < total) {
            const current = nextIndex++;
            try {
                const stat = await fs.stat(paths[current]);
                bytes += stat.size;
            } catch {
                // File may have been removed/renamed since enumeration; skip it.
            }
            filesScanned++;
            if (filesScanned % progressStep === 0) {
                parentPort?.postMessage({ type: "progress", filesScanned, totalFiles: total, bytes });
            }
        }
    }

    const lanes = Array.from({ length: Math.min(CONCURRENCY, total) }, () => scanLane());
    await Promise.all(lanes);

    parentPort?.postMessage({ type: "done", bytes, filesScanned });
}

run().catch((error: unknown) => {
    parentPort?.postMessage({ type: "error", message: error instanceof Error ? error.message : String(error) });
});
