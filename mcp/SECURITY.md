# Security model

## Scope and trust boundary

Avatar Studio MCP generates a finite set of robot avatar designs from numeric/enum/hex inputs. It runs as a local stdio subprocess owned by the MCP host. Trusted assets and dependencies are loaded as application code during startup; tool invocations have no filesystem, network, database, shell, or credential APIs.

The trusted boundary includes the Node runtime, repository code, installed native renderer, dependency lockfile, host/client, and launch configuration. Tool arguments are untrusted. Model instructions are never executed by this server. A request containing shell commands, paths, SVG markup, URLs, or undeclared properties is rejected.

## Enforced controls

| Risk | Control |
| --- | --- |
| SVG/XSS/URL injection | Strict schemas accept only six-digit hex colors, enums, booleans, bounded numbers. Generated SVG contains fixed templates and numeric geometry; no script, foreignObject, text input, external image, or external href. |
| Filesystem traversal / SSRF / command injection | No relevant tool or parameter. No URL fetcher, file reader/writer, or shell launcher. Rasterizer receives generated SVG only; system fonts are disabled. |
| Prototype pollution / hostile object graphs | Incoming message graph rejects `__proto__`, `constructor`, `prototype`, depth over 12, or over 1,000 visited values. Zod objects reject unknown configuration keys. |
| Unbounded JSON input | SDK stdio read buffer capped at 32 KiB. Oversized input closes the connection. |
| Traffic flood | 120 incoming protocol messages per minute per process, then disconnect. This includes setup, pings, notifications, and tool calls. |
| Render resource exhaustion | Two active render workers maximum; 5-second deadline and client cancellation. SVG/PNG are 32–512 pixels; GIF is 32–128 pixels and 12 frames. |
| Response amplification | Artifacts and serialized responses are capped below 750,000 bytes. Worker output is drained privately. |
| Environment leakage | Render workers use an empty environment; responses expose no environment variables, paths, or stack traces. Pass a minimal environment from your client as well. |
| Reflected prompt injection | The pre-dispatch tool gate returns a generic error for invalid tools/arguments without echoing the supplied payload. Catalog labels/descriptions are trusted static strings. |
| Persistent storage exposure | No accounts, uploaded assets, generated-file storage, or persistent cross-client state. Artifacts are returned in the call result. |
| Supply-chain drift | Exact direct dependency versions and lockfile; install with `npm ci --ignore-scripts`. Use a trusted Node executable and checkout, not an unpinned `npx` server command. |

MCP tool annotations describe these properties to clients; they are hints, not an authorization mechanism. Server-side validation and restricted functionality enforce the boundary.

## Resource and operational limitations

Worker heap limits and Node's `--max-old-space-size` limit JavaScript heap, **not total native memory**. Fixed render dimensions, fixed templates, and native worker deadlines reduce abuse, but this is not an operating-system sandbox. A dependency/runtime vulnerability or compromised local host remains outside the tool-schema protections. For stronger isolation, run as an unprivileged OS user or in a container with read-only code, no network, no secrets, and OS-enforced CPU/memory/PID limits. Do not mount developer home directories or application credentials into that environment.

No component can honestly guarantee perfect security. The implementation is tested and hardened but has not received an independent penetration test or formal audit. `npm audit` results describe known published dependency advisories at the time it is run; they do not prove absence of vulnerabilities.

## Remote hosting is a separate security design

Do not expose or proxy this local subprocess to untrusted tenants as-is. A future remote transport requires verified authentication/authorization, TLS, correct origin/host validation and DNS-rebinding protection, per-principal quotas, tenant isolation, request cancellation, and bounded artifact storage. Never pass upstream bearer tokens through to unrelated services. Follow the current [MCP Security Best Practices](https://modelcontextprotocol.io/specification/latest/basic/security_best_practices) and [authorization specification](https://modelcontextprotocol.io/specification/latest/basic/authorization).

## Verification and maintenance

Run `npm test --prefix mcp` and `npm audit --prefix mcp --omit=dev` before releases and after updating the lockfile. Review changed templates before adding a new accessory; the security model assumes those templates are trusted code. Never replace generated-template rendering with a client-supplied SVG parser.
