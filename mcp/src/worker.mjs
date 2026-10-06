import { parentPort, workerData } from 'node:worker_threads';
import { renderAvatar } from './render.mjs';
try { parentPort.postMessage({ ok: true, result: renderAvatar(workerData) }); }
catch { parentPort.postMessage({ ok: false }); }
