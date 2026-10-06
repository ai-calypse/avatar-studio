# Avatar Studio

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
- Adjust eye size, eye spacing, and head roundness.
- Choose from **50 accessories**, plus None, in a grouped dropdown. Accessories fit the changing body outline.
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

The local MCP server lets agents discover accessories, validate avatar configurations, and create SVG, PNG, or GIF artifacts for applications. It shares the website's accessory catalog and shape-fitting accessory renderer. It uses predefined expressions and a deterministic blink animation rather than recording the browser's live state.

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

MCP GIFs contain 12 looping blink frames at 100 ms per frame, with a light background and reduced color palette. SVG and PNG have transparent backgrounds.

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

Once published to npm:

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
  headRoundness: 70
});

avatar.startWaiting();
// When your operation completes:
await avatar.play('success');

const svg = exportAvatarSVG(avatar, 256);
console.log(accessories); // 50 entries with id, name, and category
```

Call `customizeAvatar` after attaching the element to the page. It accepts partial appearance updates using the color, accessory, eye-size, spacing, and head-roundness controls listed above. Unsupported fields, accessory IDs, and out-of-range values are rejected. Set expressions through the component's animation API, such as `avatar.play('success')`; the MCP-only `expression` field is not accepted by `customizeAvatar`. Settings are isolated per element and are not automatically saved to browser storage.

`exportAvatarSVG` returns a string snapshot of the current pose at a size from 32 to 512. Use the website for PNG/GIF downloads or MCP for generated PNG/GIF artifacts. In a server-rendered application, create and customize elements on the client after mounting.

Before registry publication, install directly from a local tarball:

```sh
npm pack --pack-destination /tmp
# Run in your application's directory:
npm install /tmp/ai-calypse-avatar-studio-0.1.0.tgz
```

See [the basic example](examples/basic.html), [the accessible request lifecycle example](examples/accessibility.html), and [TypeScript declarations](index.d.ts) for the underlying component API. [Publishing instructions](RELEASING.md) explain npm login, validation, and release automation.

## Development checks

```sh
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

## Attribution and license

Avatar Studio extends [Agent Robot Avatar](https://github.com/CX-ArtLab/agent-robot-avatar). The original robot character and visual identity were designed by CX ArtLab; this repository adds the personalized creator, accessory catalog, exports, showcases, and local MCP integration.

The original project's character and visual identity notice is retained: the MIT license permits use, modification, and distribution of the software, but does not transfer ownership of the original character's name or identity or grant the right to claim it as another party's original character.

[MIT License](LICENSE), with copyright notices for CX ART Lab and ai-calypse.
