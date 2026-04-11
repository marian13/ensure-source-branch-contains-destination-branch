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

## Changelog

`CHANGELOG.md` is generated automatically by [release-please](https://github.com/googleapis/release-please) - do not edit it by hand.

Commit message prefixes that affect the changelog and version:

| Prefix             | Example                      | Version bump |
| ------------------ | ---------------------------- | ------------ |
| `feat:`            | `feat: add new input`        | minor        |
| `fix:`             | `fix: correct error message` | patch        |
| `feat!:` / `fix!:` | `feat!: remove old input`    | major        |
| `chore:`           | `chore: update deps`         | none         |
