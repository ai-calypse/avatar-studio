import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { createServer } from './server.mjs';
import { GuardedTransport } from './security.mjs';

let instance;
const transport = new GuardedTransport();
const handle = serveStdio(() => { instance = createServer(); return instance.server; }, {
  transport,
  maxSubscriptions: 0,
  onerror: () => process.stderr.write('Avatar Studio MCP: protocol input rejected.\n'),
});
let closing = false;
async function shutdown() {
  if (closing) return;
  closing = true;
  await instance?.dispose();
  await handle.close();
}
process.stdin.once('end', shutdown);
process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
