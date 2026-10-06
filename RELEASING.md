# Publish Avatar Studio

The browser package is `@ai-calypse/avatar-studio`. It has no runtime dependencies and does not contain the website or MCP server. Its first version is `0.1.0`; upstream version history is retained separately in the changelog.

## First publication

1. Use an npm account authorized to publish under the `@ai-calypse` scope. A GitHub account with the same name does not grant npm access.
2. Run `npm login --registry=https://registry.npmjs.org/` and complete browser authentication and any required two-factor verification. Keep credentials out of Git.
3. Install dependencies with `npm ci`, and install test browsers with `npx playwright install chromium firefox webkit`.
4. Run `npm run release:check`. This runs the full suite and previews the exact package contents.
5. Run `npm publish --access public --tag latest`. The prepublish hook runs validation again. Complete npm's authentication prompts if required.
6. Verify `npm view @ai-calypse/avatar-studio@0.1.0 version` and install it into a new application.

For local installation before registry publication, run `npm pack --pack-destination /tmp` and install the resulting `.tgz` with `npm install /tmp/ai-calypse-avatar-studio-0.2.0.tgz`.

## Subsequent releases with GitHub Actions

After first publication, configure a trusted publisher in the npm package settings:

- GitHub owner: `ai-calypse`
- Repository: `avatar-studio`
- Workflow: `publish-npm.yml`
- Environment: leave blank

The workflow uses OIDC instead of an npm token. Setup is described in [npm trusted publishing documentation](https://docs.npmjs.com/trusted-publishers/). It will not work until that association is configured on npm.

For each release, update `package.json`, `package-lock.json`, `src/agent-robot-avatar-version.js`, and the changelog. Push the changes, then publish a GitHub Release with the matching `v<version>` tag. The workflow validates the release and package, tests all three browser engines, and publishes. Prereleases use the `next` npm tag; stable versions use `latest`.

Do not publish a GitHub Release for a version already manually published, since the workflow would attempt the same immutable version again. Use the next version when transitioning to automated publishing. Never overwrite tags or reuse a published npm version.

The local MCP is separate: install its dependencies with `npm ci --prefix mcp --ignore-scripts` and run `npm run test:mcp`. It is not published by this workflow.
