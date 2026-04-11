# Contributing

## Setup

```bash
npm install
```

## Development

```bash
npm run format   # format code
npm run lint     # lint code
npm run test     # run tests
npm run build    # build dist/index.js
```

## Submitting changes

1. Fork the repository.
2. Create a branch from `main`.
3. Make your changes with [Conventional Commits](https://www.conventionalcommits.org/) messages (e.g. `feat:`, `fix:`, `chore:`).
4. Open a pull request.

## Release process

Releases are fully automated via [release-please](https://github.com/googleapis/release-please) and triggered by merging to `main`:

1. **Regular push to `main`** — release-please creates or updates a release PR, bumping the version in `package.json` and `CHANGELOG.md` based on conventional commit messages.
2. **Merge the release-please PR** — release-please publishes a GitHub Release and sets the version tag (e.g. `v1.2.3`). The CD workflow then automatically moves the floating `v1` tag to the new release SHA so users pinned to `@v1` get the update immediately.

No manual tagging or version bumping is needed.

## Changelog

`CHANGELOG.md` is generated automatically by [release-please](https://github.com/googleapis/release-please) - do not edit it by hand.

Commit message prefixes that affect the changelog and version:

| Prefix             | Example                      | Version bump |
| ------------------ | ---------------------------- | ------------ |
| `feat:`            | `feat: add new input`        | minor        |
| `fix:`             | `fix: correct error message` | patch        |
| `feat!:` / `fix!:` | `feat!: remove old input`    | major        |
| `chore:`           | `chore: update deps`         | none         |
