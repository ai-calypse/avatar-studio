# MCP changelog

## 0.2.0

- Add capability discovery, deterministic user identities, brand palette suggestions, batch generation, design variants, expression packs, and sprite sheets (10 tools total).
- Add optional background, circle/rounded clipping, percentage padding, and static presence badges to render tools.
- Improve sad/angry eye geometry so expression assets are visually distinct.
- Return ordered manifests with safe IDs, configs, hashes, sizes, and sprite coordinates alongside generated artifacts.
- Bound bulk output, item counts, sheet dimensions, and worker concurrency; validate again inside workers and preserve cancellation/timeouts.
- Document workflows and identity privacy limitations, and add real stdio integration and pixel-level tests.
- Retain the original tools and stdio entrypoint. Existing clients need a connection restart for tool discovery.

## 0.1.0

- Local stdio server with accessory discovery, configuration validation, and SVG/PNG/GIF generation.
- Strict input schemas, bounded transport and rendering, and no file/network/shell tools.
