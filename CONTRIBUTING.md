# Contributing to Avatar Studio

Avatar Studio includes a dependency-free browser component, a browser creator, and a local MCP server. Bug reports, documentation improvements, and focused pull requests are welcome.

## Local setup

Use Node.js 22.13+ or 24+, npm, and Git. The component runs in the browser; Node is needed for development tools and the MCP server.

```sh
git clone https://github.com/ai-calypse/avatar-studio.git
cd avatar-studio
npm ci --ignore-scripts
npm ci --prefix mcp --ignore-scripts
npx playwright install --with-deps chromium firefox webkit
npm run dev -- --port 4175
```

Open `http://127.0.0.1:4175/demo/?lang=en`. No accounts, API keys, or external services are required for development. Ignore local MCP client configuration and generated exports; never commit credentials, private user identifiers, or personal data.

## Before opening a pull request

```sh
npm test
npm run test:mcp
npm audit --audit-level=high
npm audit --prefix mcp --audit-level=high
```

`npm test` runs ESLint, syntax checks, TypeScript API checks, release/package checks, the three-browser suite, and the static site build. ESLint enforces recommended correctness rules with no warnings; legacy animation files retain an unused-variable exception to avoid changing extension contracts. New customization, MCP, and tooling code must pass the complete recommended rules. For focused browser work, use `npx playwright test tests/studio.spec.mjs --project=chromium`. If using an existing server on port 4175, set `AVATAR_TEST_PORT=4175`.

GitHub CI runs the same checks on pull requests and `main`, validates workflow syntax with actionlint, and tests MCP on Node 22 and 24. CodeQL scans JavaScript/TypeScript and Actions workflows. Dependency Review rejects new high/critical vulnerable dependencies, and Dependabot proposes weekly dependency updates. Weekly checks also catch newly disclosed vulnerabilities in existing dependencies. Passing automated checks does not replace human review.

Keep changes focused. Preserve the browser package's zero runtime dependencies unless a dependency is clearly justified. Use public APIs in application examples, preserve accessibility and reduced-motion behavior, and document API changes in the README and changelog. Changes to identity recipes or shape generation must explain their effect on existing users' repeatable avatars. MCP changes must retain bounded inputs, outputs, worker limits, cancellation, and the security tests.

## Bug reports and security

Check the latest `main` branch first. Include reproduction steps, browser/OS or Node/MCP client version, expected behavior, and a minimal example. Use the issue templates for ordinary bugs and features. For vulnerabilities, follow [SECURITY.md](SECURITY.md) rather than opening a public issue.

## License and conduct

Contributions are licensed under the [MIT License](LICENSE). Retain original copyright and attribution notices. Follow [our community guidelines](CODE_OF_CONDUCT.md).
