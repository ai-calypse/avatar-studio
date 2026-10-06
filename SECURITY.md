# Security policy

## Supported versions

Security fixes target the latest published npm version and the current `main` branch, including the local MCP server. Older versions are not maintained separately. Update to the latest release or main branch when a fix is available. There is no guaranteed response or remediation deadline.

## Report a vulnerability privately

Use [GitHub's private vulnerability reporting](https://github.com/ai-calypse/avatar-studio/security/advisories/new). Include affected versions, reproduction steps, the impact, and a minimal proof of concept. Do not include passwords, tokens, private profile identifiers, or other people's data. Avoid public issues and public exploit details until maintainers have had an opportunity to investigate and coordinate a fix.

For ordinary bugs and feature requests, use the repository's issue templates.

## Scope and protections

The browser component, website creator, generated exports, local MCP server, dependency handling, and release workflows are in scope. The MCP's boundaries, limitations, and input/output/resource controls are documented in [mcp/SECURITY.md](mcp/SECURITY.md). The host, Node runtime, native renderer, and installed dependencies remain part of the trusted computing base; this project does not provide an OS sandbox.

GitHub CI uses read-only permissions by default, SHA-pinned actions, and installs locked dependencies without lifecycle scripts. It runs ESLint, type and package checks, browser and MCP security tests, dependency audits, Dependency Review, and CodeQL. Dependabot proposes updates for npm dependencies and Actions. Secret scanning and push protection are enabled in the GitHub repository. These checks reduce risk but cannot guarantee vulnerability-free software.
