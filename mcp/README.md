# Avatar Studio MCP

A local **stdio MCP server** for developers and agents to generate Avatar Studio robot avatars in memory. It uses the same 50-accessory catalog and shape-fitting accessory renderer as the website. Node.js 22 or newer is required.

## Install and connect

From the repository checkout:

```sh
npm ci --prefix mcp --ignore-scripts
npm run test:mcp
```

Configure your MCP host to launch Node directly with an absolute entrypoint. Do not route the command through a shell. The following is a generic MCP client JSON example; replace the two paths with your trusted local checkout and Node executable. Your client may use a different configuration format.

```json
{
  "mcpServers": {
    "avatar-studio": {
      "command": "/absolute/path/to/node",
      "args": [
        "--max-old-space-size=192",
        "/absolute/path/to/avatar-studio/mcp/src/index.mjs"
      ],
      "env": {}
    }
  }
}
```

A tested, machine-specific configuration is provided in `client-config.local.json` when this checkout is prepared locally. That file is ignored by Git. The server can be started manually with `npm run mcp:start`, but stdin/stdout must be attached to an MCP client for protocol use. There is no HTTP endpoint or credential to configure.

## Tools

| Tool | Purpose |
| --- | --- |
| `list_accessories` | List all 50 accessories, or one catalog category. |
| `validate_avatar` | Validate and normalize an application-ready avatar configuration. |
| `create_avatar` | Return an SVG, PNG, or looping GIF artifact. |

Example `create_avatar` arguments:

```json
{
  "format": "png",
  "size": 256,
  "config": {
    "body": "#182725",
    "eyes": "#dbf59d",
    "accessory": "headphones",
    "accessoryColor": "#ffffff",
    "matchEyes": true,
    "eyeSize": 100,
    "spacing": 0,
    "headRoundness": 70,
    "expression": "happy"
  }
}
```

For GIF, set `"format": "gif", "size": 128`. GIFs contain 12 deterministic blink frames at 100 ms per frame and loop indefinitely. SVG/PNG snapshots are transparent; GIFs have a light background and a reduced color palette. Inputs are limited to the documented controls, rather than arbitrary images or free-form SVG. Expression options are `idle`, `happy`, `sad`, `angry`, `sleep`, and `surprise`.

Tool results include normalized configuration, format, size, MIME type, byte count, and SHA-256 checksum in `structuredContent`. The actual artifact is in `content`:

- SVG: embedded resource with `resource.text` containing the complete SVG.
- PNG: image block with base64 `data`.
- GIF: embedded resource with base64 `resource.blob`.

An `avatar://generated/...` URI identifies the returned artifact; it is not a URL to fetch or a stored resource. Decode the provided data in your application and save it using **your application's** authorized storage layer. The server does not write files. The normalized configuration can be retained for later regeneration. Input changes produce deterministic output with the pinned renderer versions; byte-level stability across future dependency versions is not promised.

## Security boundaries

Read [SECURITY.md](SECURITY.md) for protections, threat model, and limitations. This server is built for a trusted host launching a local subprocess. It is not a public, multi-tenant service. Transport ownership provides the local trust boundary; there is no network listener and no bearer-token authentication layer.

- No tools to read/write files, fetch URLs, execute commands, run code, or load arbitrary SVG.
- Strict allowlisted schemas, six-digit hex colors, bounded numbers, and rejection of unknown properties.
- Render workers receive no inherited environment variables. System font discovery is disabled.
- Inbound frame, object-depth, object-element, request-rate, render-concurrency, render-time, output-size, and image-size limits.
- Errors from rejected arguments are generic and do not echo supplied payloads.
- Dependencies are pinned with a committed lockfile; installation uses `--ignore-scripts`.

## Verify

```sh
npm test --prefix mcp
npm run check --prefix mcp
npm audit --prefix mcp --omit=dev
```

Tests exercise a real MCP client connection, all 50 SVG accessories, raster exports, payload injection, unknown tools/properties, prototype/depth abuse, oversized frames, traffic floods, concurrent renders, cancellation, deterministic output, and process cleanup.
