# GitHub Action to Ensure That Source Branch Contains Destination Branch

A GitHub Action that verifies the source branch contains all commits from the destination branch before allowing a merge. Prevents out-of-date pull requests from being merged.

## Usage

Add a step to workflow like so:

```yaml
steps:
  # ...
  - uses: marian13/ensure-source-branch-contains-destination-branch@v1
  # ...
```

Here is a minimal end-to-end example (`.github/workflows/ci.yml`):

```yaml
name: CI

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: marian13/ensure-source-branch-contains-destination-branch@v1
```

## Inputs

All inputs are optional.

- `source-branch`: The branch to check. Defaults to the PR head branch on `pull_request`, or the current branch on `push`.
- `destination-branch`: The branch that must be contained in the source branch. Defaults to the PR base branch on `pull_request`, or the repository default branch on `push`.
- `token`: GitHub token used to call the SHA API and the Compare API. Defaults to `github.token`.
- `tag`: Tag prepended to log messages (e.g. `[my-tag] message`). Set to an empty string to log without a tag. Defaults to `ensure-source-branch-contains-destination-branch`.

Example with explicit inputs:

```yaml
steps:
  # ...
  - uses: marian13/ensure-source-branch-contains-destination-branch@v1
    with:
      source-branch: feature/some-feature
      destination-branch: main
      token: ${{ secrets.GITHUB_TOKEN }}
      tag: my-tag
  # ...
```

## Outputs

- `status`: Result of the branch comparison. Possible values: `sameBranch`, `ahead`, `identical`, `behind`, `diverged`, `shaApiError`, `compareApiError`, `unknownStatus`, `unexpectedException`.

Example of how to read the status in a subsequent step:

```yaml
steps:
  # ...
  - id: check
    uses: marian13/ensure-source-branch-contains-destination-branch@v1

  - if: always()
    run: echo "Status was ${{ steps.check.outputs.status }}"
  # ...
```

## Supported Events

Currently only `push` and `pull_request` are supported.

## More Docs

- [What happens on unsupported events?](docs/user/unsupported-events.md)
- [How does this action work?](docs/user/how-it-works.md)
- [Why not `git fetch`? Why SHA and Compare API?](docs/user/why-not-git-fetch.md)
- [How to contribute?](CONTRIBUTING.md)

---

Copyright (c) 2022-2026 Marian Kostyk.
