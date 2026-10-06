# Avatar Studio MCP

A local **stdio MCP server** for developers and agents to build avatar workflows in memory. Version **0.4.0** provides 11 tools for user identities, branded teams, app states, bulk assets, and sprite sheets. It uses the same 50-accessory catalog and shape-fitting accessory renderer as the website. Node.js 22 or newer is required.

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

## Tools and real use cases

Call `get_capabilities` first to discover supported formats, limits, expressions, and recommended workflows. Use `list_accessories` to discover IDs rather than inventing them.

| Tool | What it does | Example use |
| --- | --- | --- |
| `get_capabilities` | Reports supported workflows and limits. | Let a coding agent plan which assets an app needs. |
| `list_accessories` | Lists all 50 accessories, optionally by category. | Choose recognizable accessories for support, guide, and admin bots. |
| `validate_avatar` | Normalizes and validates configuration. | Check an app's saved avatar settings. |
| `generate_identity` | Maps an opaque stable ID to a repeatable avatar config. | Give new users a default profile picture without uploads. |
| `suggest_brand_palette` | Suggests body/eye/accessory colors and measured contrast. | Adapt a support mascot to company colors. |
| `create_avatar` | Returns SVG, PNG, or a looping blink GIF. | Profile images, logos, chat avatars, or a bot mascot. |
| `create_avatar_batch` | Generates up to 12 named SVG/PNG assets with a manifest. | Seed chat demos, team directories, or multi-agent apps. |
| `create_avatar_variants` | Generates up to 12 repeatable alternatives. | Offer users six design choices while preserving brand colors. |
| `create_expression_pack` | Exports matching expression images. | Map a guide's images to onboarding or chat states. |
| `create_sprite_sheet` | Packs up to 16 configurations into one SVG/PNG and coordinate manifest. | CSS sprites, games, canvas renderers, or expression atlases. |

### Stable default profile pictures

Call `generate_identity`:

```json
{
  "seed": "user-2048",
  "overrides": { "body": "#182725", "eyes": "#dbf59d" }
}
```

Pass the returned `config` to `create_avatar`. Seeds accept 1–128 ASCII letters/digits plus `.`, `_`, `:`, and `-`; start with a letter or digit. Use an opaque ID rather than a name, email address, or secret. The raw seed is never returned. The returned fingerprint is an unkeyed hash and is **not** an anonymity or authentication guarantee. Different seeds can produce visually similar or identical avatars.

Identity recipe version `1` is deterministic. Store the returned configuration if an avatar must remain unchanged across future recipe or renderer updates. Overrides are partial: unspecified generated features are preserved.

### Branded teams and design choices

1. Call `suggest_brand_palette` with `{ "primary": "#738b3b", "accent": "#dbf59d", "mode": "dark" }`.
2. Pass its returned `config` to `create_avatar_variants`:

```json
{
  "config": { "body": "#343f1b", "eyes": "#ffffff", "accessoryColor": "#dbf59d" },
  "seed": "support-team",
  "count": 6,
  "vary": "accessories",
  "format": "png",
  "size": 128,
  "presentation": { "frame": "circle", "background": "#f5f5ef", "padding": 6 }
}
```

`vary: "accessories"` preserves colors and face geometry. `"colors"` preserves the accessory and face geometry. `"look"` varies colors, accessories, eye geometry, and roundness. Use the same seed to reproduce the alternatives.

Palette suggestions report eye/body and accessory/body contrast. Eye colors are selected for strong contrast; an accent can still have low contrast. These measurements are not a full accessibility audit. Presence badges should be accompanied by status text in your app.

### Chat users and fixtures in one call

Call `create_avatar_batch`:

```json
{
  "items": [
    { "id": "support", "config": { "accessory": "headphones", "eyes": "#dbf59d" } },
    { "id": "guide", "config": { "accessory": "wizard", "body": "#263b69" } }
  ],
  "format": "png",
  "size": 128,
  "presentation": { "frame": "rounded", "background": "#f5f5ef", "status": "online" }
}
```

Batch IDs must be unique, 1–32 letters/digits/underscores/hyphens, starting with a letter or digit. Batch, variant, and expression tools support SVG/PNG at 32–256 pixels, with a common format, size, and presentation for the call. They return `structuredContent.artifacts` in the same order as the individual `content` artifacts; each record includes its ID, config, hash, MIME type, and byte count. There is no ZIP or filesystem write.

### Expression images and sprite sheets

Call `create_expression_pack`:

```json
{
  "config": { "accessory": "headphones", "body": "#182725" },
  "expressions": ["idle", "happy", "sad", "angry", "sleep", "surprise"],
  "format": "png",
  "size": 128
}
```

The default is all six expressions. Each asset is named after its expression and preserves the same appearance. These are state images; they do not replace the interactive npm animation runtime or provide skeletal animation.

To pack configurations into a sheet, call `create_sprite_sheet`:

```json
{
  "items": [
    { "id": "idle", "config": { "accessory": "headphones", "expression": "idle" } },
    { "id": "happy", "config": { "accessory": "headphones", "expression": "happy" } }
  ],
  "columns": 2,
  "cellSize": 128,
  "format": "png"
}
```

You can also use the ID/config pairs from a variant or expression manifest as sheet items. The result has a single artifact plus `structuredContent.frames`, with `id`, `config`, `x`, `y`, `width`, and `height` for each cell. Use those coordinates for CSS `background-position` or canvas `drawImage` source rectangles. Cells are 32–128 pixels, columns 1–4, and total dimensions at most 512 × 512. Unused cells are transparent.

## Fluid and repeatable body shapes

Use `bodyShape: "classic"` for the existing square-to-circle range, or `"random"` for a smooth asymmetric silhouette. `shapeSeed` is an unsigned 32-bit integer (0–4294967295), default 0. Together with `headRoundness` it determines the shape, and accessories follow the outline. The shape does not change randomly between GIF frames or exports.

```json
{
  "format": "svg",
  "config": { "bodyShape": "random", "shapeSeed": 42, "headRoundness": 75, "accessory": "headphones" }
}
```

For unique default user profiles, use `generate_identity` with `overrides: { "bodyShape": "random" }`. Each identity seed derives its own shape seed. Existing classic identities retain their appearance. `create_avatar_variants` with `vary: "look"` varies the shape seed when the base config uses random bodies; accessory-only and color-only variants preserve it. Browser and MCP random geometry share the same generator. Store the full config to reproduce an avatar later.

## Single avatar controls and artifacts

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

For GIF, set `"format": "gif", "size": 128`. GIFs contain 12 deterministic blink frames at 100 ms per frame and loop indefinitely. SVG/PNG snapshots are transparent by default; GIFs have a light background and a reduced color palette. Inputs are limited to the documented controls, rather than arbitrary images or free-form SVG. Expression options are `idle`, `happy`, `sad`, `angry`, `sleep`, and `surprise`.

All render tools accept an optional `presentation` object:

| Field | Values | Default |
| --- | --- | --- |
| `background` | Six-digit hex or `transparent`. | `transparent` |
| `frame` | `none`, `circle`, `rounded`. | `none` |
| `padding` | Number from 0 to 24, as a percentage on each side. | `0` |
| `status` | `none`, `online`, `away`, `busy`, `offline`. | `none` |

Frames clip the composition; add padding if a hat or other accessory needs more space. Status badges are decorative snapshots, not live presence tracking. GIF uses the chosen background when provided; otherwise its transparent area becomes the fixed light background. All render outputs are size-bounded.

Single-avatar tool results include normalized configuration, format, size, MIME type, byte count, and SHA-256 checksum in `structuredContent`. The actual artifact is in `content`:

- SVG: embedded resource with `resource.text` containing the complete SVG.
- PNG: image block with base64 `data`.
- GIF: embedded resource with base64 `resource.blob`.

An `avatar://generated/...` URI identifies the returned artifact; it is not a URL to fetch or a stored resource. Decode the provided data in your application and save it using **your application's** authorized storage layer. The server does not write files. The normalized configuration can be retained for later regeneration. Input changes produce deterministic output with the pinned renderer versions; byte-level stability across future dependency versions is not promised.

## Full interactive control parity

`create_avatar_component` returns fixed-template HTML, browser module code, the normalized configuration, and the required npm package. It supports every public action/alias (including waiting-wrap, inspect, failure, love, and random), all appearance controls including antenna visibility, and these `behavior` fields: `antennaFlash`, `pointerFollow`, `loop`, `pressSqueeze`, `antennaDrag`, `motion`, `wakeOn`, `autoSleep`.

```json
{
  "config": {"bodyShape":"random","shapeSeed":42,"antenna":true,"accessory":"headphones","matchEyes":true},
  "behavior": {"antennaFlash":true,"pointerFollow":true,"loop":true,"motion":"auto","wakeOn":"interaction","autoSleep":60000},
  "action":"waiting-wrap",
  "size":170
}
```

The generated code requires `@ai-calypse/avatar-studio >=0.2.0` and a connected browser element. The server returns code as data; it does not execute, install, fetch, or write anything. Use it in a bundler/browser app you control. Image exports retain the six documented poses; full action lifecycles, pointer following, gesture interaction, and expression looping require this live component. Antenna visibility is also respected by all SVG/PNG/GIF asset tools.

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

Tests exercise complete identity/brand/batch/variant/expression/sprite workflows over real stdio, pixel-exact sprite placement, unique clip IDs, measured eye contrast, maximum batch/sheet limits, malicious new-tool arguments, and a real MCP client connection, all 50 SVG accessories, raster exports, payload injection, unknown tools/properties, prototype/depth abuse, oversized frames, traffic floods, concurrent renders, cancellation, deterministic output, and process cleanup.

## Update an existing connection

After updating the checkout, run the install/verification commands above and restart the MCP connection in your host so it discovers all 11 tools. The command and entrypoint are unchanged. This update does not create a remote endpoint or update the separately published browser npm package.
