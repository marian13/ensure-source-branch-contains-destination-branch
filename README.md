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

on: [push]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: marian13/ensure-source-branch-contains-destination-branch@v1
```

## Inputs

All inputs are optional.

| Input | Description | Default |
|---|---|---|
| `source-branch` | The branch to check. | `github.ref_name` (branch that triggered the workflow) |
| `destination-branch` | The branch that must be contained in the source branch. | `github.event.repository.default_branch` |
| `token` | GitHub token used to call the Compare API. | `github.token` |

Example with explicit inputs:

```yaml
steps:
  # ...
  - uses: marian13/ensure-source-branch-contains-destination-branch@v1
    with:
      source-branch: feature/my-feature
      destination-branch: main
      token: ${{ secrets.GITHUB_TOKEN }}
  # ...
```

## How does it work?

---

Copyright (c) 2022-2026 Marian Kostyk.
