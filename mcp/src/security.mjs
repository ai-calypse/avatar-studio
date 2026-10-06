import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { LIMITS, TOOL_SCHEMAS } from './schema.mjs';

export function safeMessage(message) {
  let count = 0;
  function visit(value, depth) {
    if (++count > 1000 || depth > 12) return false;
    if (!value || typeof value !== 'object') return true;
    return Object.entries(value).every(([key, item]) => !['__proto__', 'constructor', 'prototype'].includes(key) && visit(item, depth + 1));
  }
  return visit(message, 0);
}

// Use the SDK's bounded parser, with a pre-dispatch validation gate. Errors never
// include attacker-controlled arguments or paths in model-visible output.
export class GuardedTransport {
  constructor(stdin = process.stdin, stdout = process.stdout) {
    this.inner = new StdioServerTransport(stdin, stdout, { maxBufferSize: LIMITS.inputBytes });
    this.windowStart = Date.now(); this.count = 0;
    this.inner.onerror = () => this.onerror?.(new Error('Protocol input rejected'));
    this.inner.onclose = () => this.onclose?.();
    this.inner.onmessage = message => {
      if (Date.now() - this.windowStart >= 60000) { this.windowStart = Date.now(); this.count = 0; }
      if (++this.count > LIMITS.requestsPerMinute || !safeMessage(message)) { void this.close(); return; }
      if (message.method === 'tools/call') {
        const schema = Object.hasOwn(TOOL_SCHEMAS, message.params?.name || '') ? TOOL_SCHEMAS[message.params.name] : null;
        const validated = schema?.safeParse(message.params?.arguments ?? {});
        if (!validated?.success) {
          if (message.id !== undefined) void this.send({ jsonrpc: '2.0', id: message.id, error: { code: -32602, message: 'Invalid avatar tool or arguments.' } });
          return;
        }
      }
      this.onmessage?.(message);
    };
  }
  start() { return this.inner.start(); }
  close() { return this.inner.close(); }
  send(message) {
    if (Buffer.byteLength(JSON.stringify(message)) > LIMITS.outputBytes) return Promise.reject(new Error('Response exceeds limit'));
    return this.inner.send(message);
  }
}
