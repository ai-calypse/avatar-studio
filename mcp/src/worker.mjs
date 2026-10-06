import { parentPort, workerData } from 'node:worker_threads';
import { renderJob } from './jobs.mjs';
try { parentPort.postMessage({ ok: true, result: renderJob(workerData) }); }
catch { parentPort.postMessage({ ok: false }); }
