# Avatar Studio

[![Validate](https://github.com/ai-calypse/avatar-studio/actions/workflows/validate.yml/badge.svg)](https://github.com/ai-calypse/avatar-studio/actions/workflows/validate.yml) [![CodeQL](https://github.com/ai-calypse/avatar-studio/actions/workflows/codeql.yml/badge.svg)](https://github.com/ai-calypse/avatar-studio/actions/workflows/codeql.yml)
Create a personalized robot avatar for your profile, team chat, app, or AI assistant. Avatar Studio combines a browser-based creator with a local MCP server so people and agents can generate avatars from the same accessory catalog.

Built on [Agent Robot Avatar by CX ArtLab](https://github.com/CX-ArtLab/agent-robot-avatar), using SVG and vanilla JavaScript. The website runs without a backend or account; the MCP server runs separately as a local Node.js subprocess.

## Run the website

Requires Node.js 22 or newer and npm.

```sh
git clone https://github.com/ai-calypse/avatar-studio.git
cd avatar-studio
npm ci
npm run dev
```

Open [Avatar Studio locally](http://127.0.0.1:4173/demo/?lang=en). To use another port:

```sh
npm run dev -- --port 4175
```

The creator opens immediately, with a live preview and downloads alongside the customization controls:

- Choose body, eye, and accessory colors independently, or enable **Match eyes** for the accessory.
- Adjust eye size, eye spacing, and head roundness. Choose **Fluid / random** for an organic body, then **Shuffle** to find a unique silhouette. Your shape seed is saved with your look.
- Choose from **50 accessories**, plus None, in a grouped dropdown. Accessories fit the changing body outline.
- Choose the header language to translate controls, all 50 accessories, showcases, and download messages into English, Spanish, French, German, Portuguese, Japanese, Korean, Simplified Chinese, or Traditional Chinese. The URL and browser remember your selection.
- Try expressions and movement settings, including blinking, pointer following, and interactive head movement.
- See your avatar in live examples of chat, profile cards, an app companion, and project branding.

Your appearance settings are saved in your browser. **Reset look** restores the defaults.

### Download formats

| Format | Website export |
| --- | --- |
| SVG | Transparent vector snapshot of the current appearance. |
| PNG | Transparent 512 × 512 image. |
| GIF | 24-frame, 256 × 256 looping recording, with a light background and reduced color palette. |

Exports are generated in the browser. SVG and PNG capture the current appearance; GIF records the live animation.

### Build for static hosting

```sh
npm run build:pages
```

Upload the contents of `.pages-site/` to your static host. The generated `index.html` serves the creator at the site root. This build contains only the website; it does not deploy or expose the MCP server.

## Connect the MCP server

The local MCP server provides **10 tools** for stable user identities, brand palettes, batch exports, design variants, expression packs, sprite sheets, and SVG/PNG/GIF generation. It shares the website's accessory catalog and shape-fitting accessory renderer. It uses predefined expressions and a deterministic blink animation rather than recording the browser's live state.

From the repository checkout, install its separate dependencies and verify the server:

```sh
npm ci --prefix mcp --ignore-scripts
npm run test:mcp
```

Add the following entry to your MCP client's configuration. Replace both absolute paths with your Node executable and this repository's location. Run `command -v node` to find Node; your client may use a different configuration format.

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

Restart or reconnect your MCP client after saving its configuration. The client launches and manages the server process. No API key, HTTP URL, or separate website process is required.

`npm run mcp:start` also starts the server manually, but it speaks MCP over stdin/stdout and needs an MCP client attached. It does not start a web server or interactive command prompt.

### Available tools

| Tool | Arguments | Result |
| --- | --- | --- |
| `list_accessories` | `{}` for the full catalog, or an optional `category` returned by the catalog. | Accessory IDs and names grouped by category, plus generation limits. |
| `validate_avatar` | `{ "config": { ... } }` | Validated configuration with defaults applied. |
| `create_avatar` | `{ "format": "svg", "size": 256, "config": { ... } }` | Avatar artifact and metadata. |
| `get_capabilities` | `{}` | Supported formats, limits, expressions, and recommended workflows. |
| `generate_identity` | `{ "seed": "user-2048", "overrides": { ... } }` | Repeatable avatar config for a stable opaque user ID. |
| `suggest_brand_palette` | `{ "primary": "#738b3b", "mode": "dark" }` | Suggested config and measured color contrast. |
| `create_avatar_batch` | Named `items`, common `format`, `size`, and optional `presentation`. | Up to 12 files and an ordered manifest for teams or app fixtures. |
| `create_avatar_variants` | `config`, `seed`, `count`, and `vary`. | Up to 12 alternatives; preserve brand colors with `vary: "accessories"`. |
| `create_expression_pack` | `config` and optional `expressions`. | Matching images for idle, happy, sad, angry, sleep, and surprise states. |
| `create_sprite_sheet` | Named `items`, `columns`, and `cellSize`. | One SVG/PNG sheet with frame coordinates, at most 512 × 512. |

For example: “Create six branded support agents,” “Make a repeatable profile avatar for user-2048,” or “Build a sprite sheet of my guide's expressions.” See [workflow examples](mcp/README.md#tools-and-real-use-cases) for exact arguments.

Render tools also accept `presentation` for a hex/transparent background, circular or rounded frame, 0–24% padding, and an online/away/busy/offline status badge. These controls are specific to MCP exports. Batch/variant/expression tools produce SVG/PNG at 32–256 pixels; single-avatar generation retains SVG/PNG/GIF support. Results stay in memory and your app owns storage.


For example, ask your connected agent:

> Use Avatar Studio to create a dark green robot profile avatar with lime eyes and headphones that match the eyes. Return a 256-pixel PNG.

The corresponding `create_avatar` arguments are:

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

### Configuration controls

All configuration fields are optional; omitted fields use the defaults below. Unknown fields are rejected.

| Field | Accepted values | Default |
| --- | --- | --- |
| `body` | Six-digit hex color, such as `#182725`. | `#08090b` |
| `eyes` | Six-digit hex color. | `#ffffff` |
| `accessoryColor` | Six-digit hex color; used when `matchEyes` is false. | `#ffffff` |
| `matchEyes` | Boolean; use the eye color for the accessory. | `false` |
| `accessory` | An ID returned by `list_accessories`, or `none`. | `none` |
| `eyeSize` | Number from 60 to 125. | `100` |
| `spacing` | Number from −12 to 12. | `0` |
| `bodyShape` | `classic` (square-to-circle) or `random` (fluid silhouette). | `classic` |
| `shapeSeed` | Integer from 0 to 4294967295; repeats the same fluid shape. | `0` |
| `headRoundness` | Number from 0 to 100. | `50` |
| `expression` | `idle`, `happy`, `sad`, `angry`, `sleep`, or `surprise`. | `idle` |

`format` defaults to `svg`, and `size` defaults to `256`. SVG and PNG accept integer sizes from 32 to 512. **For GIF, explicitly set `size` between 32 and 128**:

```json
{
  "format": "gif",
  "size": 128,
  "config": { "accessory": "wizard", "expression": "happy" }
}
```

MCP GIFs contain 12 looping blink frames at 100 ms per frame, with a light background and reduced color palette. SVG and PNG have transparent backgrounds by default; set `presentation.background` for a solid background.

### Use artifacts in your application

The result's `structuredContent` includes the normalized configuration, format, size, MIME type, byte count, and SHA-256 checksum. The artifact is returned in `content`:

- **SVG:** embedded resource with the SVG string in `resource.text`.
- **PNG:** image block with base64 data in `data`.
- **GIF:** embedded resource with base64 data in `resource.blob`.

Decode the returned data and save it through your application's authorized storage layer. Retain the normalized configuration to regenerate the avatar later. An `avatar://generated/...` resource URI identifies the returned artifact; it is not a hosted download URL or a stored resource to fetch. The MCP server does not save files.

See [the MCP guide](mcp/README.md) for more details and [the example client configuration](mcp/client-config.example.json).

### Security model

The MCP server is designed for a trusted MCP client launching a local subprocess. It has no network listener and exposes no file, shell, URL-fetching, or arbitrary SVG tools.

Inputs use strict allowlisted schemas. Rendering has bounded image sizes, output sizes, concurrency, and execution time, with separate workers that receive no inherited environment variables. Dependencies are pinned in a lockfile.

These controls do not make the process an operating-system sandbox or a public multi-tenant service. Read [the security model and limitations](mcp/SECURITY.md) before integrating or hosting it. Remote access would require a separate authentication, isolation, and deployment design.

## npm package for applications

The browser package is **`@ai-calypse/avatar-studio`**. It includes the animated robot and cat components, the 50-accessory catalog, programmatic customization, and SVG snapshots with TypeScript declarations. It has no runtime dependencies. The website controls and Node.js MCP server are separate.

Install the published package from [npm](https://www.npmjs.com/package/@ai-calypse/avatar-studio):

```sh
npm install @ai-calypse/avatar-studio
```

Import it in your browser application's entrypoint:

```js
import { customizeAvatar, exportAvatarSVG, accessories } from '@ai-calypse/avatar-studio';

const avatar = document.createElement('agent-robot-avatar');
avatar.setAttribute('size', '160');
document.querySelector('#avatar-container').appendChild(avatar);

customizeAvatar(avatar, {
  body: '#182725',
  eyes: '#dbf59d',
  accessory: 'headphones',
  matchEyes: true,
  headRoundness: 70,
  bodyShape: 'random',
  shapeSeed: 42
});

avatar.startWaiting();
// When your operation completes:
await avatar.play('success');

const svg = exportAvatarSVG(avatar, 256);
console.log(accessories); // 50 entries with id, name, and category
```

Call `customizeAvatar` after attaching the element to the page. It accepts partial appearance updates using the color, accessory, eye-size, spacing, and head-roundness controls listed above. Unsupported fields, accessory IDs, and out-of-range values are rejected. Set expressions through the component's animation API, such as `avatar.play('success')`; the MCP-only `expression` field is not accepted by `customizeAvatar`. With `bodyShape: "random"`, the same `shapeSeed` and `headRoundness` reproduce the same silhouette in the browser and MCP. Roundness still controls the underlying softness; changing the seed changes the outline. The shape stays stable while blinking, dragging, and exporting. Shape uniqueness is visual variety, not an authentication guarantee. Settings are isolated per element and are not automatically saved to browser storage.

`exportAvatarSVG` returns a string snapshot of the current pose at a size from 32 to 512. Use `exportAvatar` for browser SVG/PNG/GIF Blobs, the website downloads, or MCP for generated artifacts. In a server-rendered application, create and customize elements on the client after mounting.

To test local changes before publishing a new version, install from a local tarball:

```sh
npm pack --pack-destination /tmp
# Run in your application's directory:
npm install /tmp/ai-calypse-avatar-studio-0.2.0.tgz
```

See [the basic example](examples/basic.html), [the accessible request lifecycle example](examples/accessibility.html), and [TypeScript declarations](index.d.ts) for the underlying component API. [Publishing instructions](RELEASING.md) explain npm login, validation, and release automation.

## Complete control API (npm 0.2.0+)

```js
import { configureAvatar, exportAvatar, avatarActions } from '@ai-calypse/avatar-studio';

// Attach the component before configuring it.
configureAvatar(avatar, {
  appearance: { bodyShape: 'random', shapeSeed: 42, antenna: true,
    accessory: 'headphones', matchEyes: true, eyes: '#dbf59d' },
  behavior: { pointerFollow: true, antennaFlash: true, loop: true,
    pressSqueeze: true, antennaDrag: true, motion: 'auto',
    wakeOn: 'interaction', autoSleep: 60000 },
  action: 'waiting-wrap'
});
const gif = await exportAvatar(avatar, { format: 'gif', size: 128,
  frames: 12, delay: 100,
  presentation: { frame: 'circle', status: 'online', padding: 4 } });
// Returns a Blob. Your app owns saving or uploading it.
console.log(avatarActions); // Every public action and alias.
```

`configureAvatar` accepts partial appearance/behavior updates and preserves previous settings. Antenna visibility is an appearance field; headwear can hide the antenna. Behavior switches default to pointer following and gestures enabled, antenna flash and expression looping disabled. Motion supports `auto`, `reduce`, `full`; wake policy supports `activity`, `interaction`, `manual`; auto-sleep is 0–86400000 ms (0 disables it). Looping waiting uses continuous waiting; other actions repeat after completing. Reset/cancellation clears queued repeats. Disconnecting prevents a queued repeat from starting. Explicit actions start asynchronously after runtime policies are applied.

`exportAvatar` supports SVG/PNG at 32–512 pixels and GIF at 32–256 pixels, 2–48 frames, 20–500 ms per frame. PNG keeps transparency by default; GIF uses a light background. Presentation supports background hex/transparent, none/circle/rounded framing, padding 0–24%, and none/online/away/busy/offline badges. `background` is a shorthand for a solid presentation background. GIF records the current live component; its image loop is independent of the expression-loop switch. No files, uploads, or network access are performed by these helpers.

| Control | Website | npm | MCP |
| --- | --- | --- | --- |
| Colors, eyes, accessory, match eyes, roundness, seeded shape, antenna visibility | Creator | `customizeAvatar` / `configureAvatar` | Asset config and `create_avatar_component` |
| All expressions/actions and aliases | Expression buttons | `play` / `configureAvatar`, `avatarActions` | `create_avatar_component`; image tools retain six supported image poses |
| Pointer follow, antenna flash, expression loop, gestures, motion, wake, auto-sleep | Movement plus component policies | `configureAvatar` and public setters/attributes | `create_avatar_component` |
| SVG, PNG, GIF | Downloads | `exportAvatar` | `create_avatar` |
| Background, frame, padding, presence badge | Showcase examples | Export presentation options | Asset presentation options |

Interactive movement and full action lifecycles run in a live browser component. An image file cannot follow a cursor. MCP's `create_avatar_component` returns validated npm integration code and normalized settings for those interactive use cases; it executes no code on the server. Website language selection affects the interface, not avatar geometry.

## Development checks

```sh
npm run lint
npm run check
npm run test:types
npm run test:mcp
npm audit --prefix mcp --omit=dev
npm run build:pages
```

For the creator's Chromium browser tests:

```sh
npx playwright install chromium
npx playwright test tests/studio.spec.mjs --project=chromium
```

Set `AVATAR_TEST_PORT=4175` if testing the local server on that port. `npm test` runs the original component's full validation suite, including Chromium, Firefox, and WebKit, and requires those Playwright browsers to be installed. Run `npm run test:mcp` separately to check the MCP server.

## Contributing and security

See [CONTRIBUTING.md](CONTRIBUTING.md) for local setup and required checks, [SECURITY.md](SECURITY.md) to report vulnerabilities privately, and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for community guidelines. CI checks code quality, types, browser compatibility, npm packaging, MCP workflows, dependencies, and GitHub Actions security.

## Attribution and license

Avatar Studio extends [Agent Robot Avatar](https://github.com/CX-ArtLab/agent-robot-avatar). The original robot character and visual identity were designed by CX ArtLab; this repository adds the personalized creator, accessory catalog, exports, showcases, and local MCP integration.

The original project's character and visual identity notice is retained: the MIT license permits use, modification, and distribution of the software, but does not transfer ownership of the original character's name or identity or grant the right to claim it as another party's original character.

[MIT License](LICENSE), with copyright notices for CX ART Lab and ai-calypse.

### Website translations

The header language picker supports English, Spanish, French, German, Portuguese, Japanese, Korean, Simplified Chinese, and Traditional Chinese. Studio copy, accessory options, export feedback, page metadata, tooltips, and accessible labels use local catalogs in `demo/avatar-studio-i18n.js`. Movement controls and the conversation demo have their own catalogs in `demo/agent-robot-avatar-demo-controls.js` and `demo/agent-robot-avatar-demo-dialog-i18n.js`. Brand names, sample people/handles, commands, package names, and file formats stay literal. No visitor text is sent to a translation service.

To add another language, add a complete locale to each catalog and the `LANGUAGES` list in the demo controls. Use a BCP 47 language tag; configure `dir=rtl` and review the layout when introducing a right-to-left language. Run `npx playwright test tests/translation-coverage.spec.mjs`: it checks every offered studio locale against the full phrase catalog and mounted interface, including image descriptions and tooltips. Add new phrases to every locale when changing copy. Missing translations fall back to English at runtime and fail coverage checks. Machine translations should be reviewed by a fluent speaker before release.

### Publish to GitHub Pages

The repository's **Deploy Live Demo** workflow builds the static site into `.pages-site` and deploys it with GitHub's Pages actions. It runs for relevant changes on `main` or manually from Actions. All asset imports are relative so the site works under `/avatar-studio/`.

1. In **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source.
2. Merge website changes into `main`, or run **Deploy Live Demo** manually on `main`.
3. Open https://ai-calypse.github.io/avatar-studio/ after the deployment succeeds.

Run `npm run build:pages` locally to inspect the generated artifact. The hosted site is a browser-only avatar editor; the MCP server runs locally and is not exposed by Pages.
