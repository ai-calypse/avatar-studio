# Security model

## Scope and trust boundary

Avatar Studio MCP generates a finite set of robot avatar designs from numeric/enum/hex inputs plus bounded opaque seeds and safe asset IDs. It runs as a local stdio subprocess owned by the MCP host. Trusted assets and dependencies are loaded as application code during startup; tool invocations have no filesystem, network, database, shell, or credential APIs.

The trusted boundary includes the Node runtime, repository code, installed native renderer, dependency lockfile, host/client, and launch configuration. Tool arguments are untrusted. Model instructions are never executed by this server. There are no command, path, raw SVG, or URL input fields. Unknown properties are rejected. Opaque seeds and asset IDs have length and character allowlists; they are data, never executed.

## Enforced controls

| Risk | Control |
| --- | --- |
| SVG/XSS/URL injection | Strict schemas accept only six-digit hex colors, enums, booleans, bounded numbers. Generated SVG contains fixed templates and numeric geometry; no script, foreignObject, SVG text labels, external image, or external href. Seeds are hashed and never inserted into SVG. Item IDs only appear in structured metadata and safe artifact identifiers. |
| Filesystem traversal / SSRF / command injection | No relevant tool or parameter. No URL fetcher, file reader/writer, or shell launcher. Rasterizer receives generated SVG only; system fonts are disabled. |
| Prototype pollution / hostile object graphs | Incoming message graph rejects `__proto__`, `constructor`, `prototype`, depth over 12, or over 1,000 visited values. Zod objects reject unknown configuration keys. |
| Unbounded JSON input | SDK stdio read buffer capped at 32 KiB. Oversized input closes the connection. |
| Traffic flood | 120 incoming protocol messages per minute per process, then disconnect. This includes setup, pings, notifications, and tool calls. |
| Render resource exhaustion | Two active render workers maximum; 5-second deadline and client cancellation. SVG/PNG are 32–512 pixels; GIF is 32–128 pixels and 12 frames. Batches/variants are at most 12 items rendered sequentially inside one worker; expression packs at most six. Sprite sheets have at most 16 cells, 128-pixel cells, and 512×512 total dimensions. Batch outputs are bounded as a whole. |
| Response amplification | Artifacts, combined job output, and complete serialized responses are capped below 750,000 bytes. Large results fail as a whole; reduce count or size to retry. Worker output is drained privately. |
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

## Identity and metadata privacy

Identity seeds accept only bounded opaque IDs; use internal pseudonymous IDs rather than emails or secrets. The raw seed is not returned or persisted. A deterministic unkeyed SHA-256 fingerprint is not an anonymity guarantee: predictable IDs can be guessed, and visual avatar collisions are possible. Store the generated config for long-term consistency across recipe changes. Do not use avatar appearance or fingerprints for authentication or authorization.

Valid asset IDs are echoed in manifests as data. Applications must treat returned metadata as data, not as instructions or executable code. This server does not embed caller-supplied text in SVG. Presence badges are static visual labels, not verified online-status claims. Palette contrast measurements do not certify application accessibility.
