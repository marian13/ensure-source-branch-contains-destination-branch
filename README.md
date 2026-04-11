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

| Input                | Description                                                                                           | Default                                                |
| -------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `source-branch`      | The branch to check.                                                                                  | `github.ref_name` (branch that triggered the workflow) |
| `destination-branch` | The branch that must be contained in the source branch.                                               | `github.event.repository.default_branch`               |
| `token`              | GitHub token used to call the SHA API and the Compare API.                                            | `github.token`                                         |
| `tag`                | Tag prepended to log messages (e.g. `[my-tag] message`). Set to an empty string to log without a tag. | `ensure-source-branch-contains-destination-branch`     |

Example with explicit inputs:

```yaml
steps:
  # ...
  - uses: marian13/ensure-source-branch-contains-destination-branch@v1
    with:
      source-branch: feature/my-feature
      destination-branch: main
      token: ${{ secrets.GITHUB_TOKEN }}
      tag: my-tag
  # ...
```

## Outputs

| Output   | Description                      | Possible values                                                                                                                    |
| -------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `status` | Result of the branch comparison. | `sameBranch`, `ahead`, `identical`, `behind`, `diverged`, `shaApiError`, `compareApiError`, `unknownStatus`, `unexpectedException` |

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

## How does it work?

1. Reads `source-branch`, `destination-branch`, `token`, and `tag` from the action inputs.
2. If both branches are the same, exits immediately with `status: sameBranch` - nothing to check.
3. Calls the [GitHub SHA API](https://docs.github.com/en/rest/git/refs#get-a-reference) (`GET /repos/{owner}/{repo}/git/ref/heads/{branch}`) to resolve the HEAD SHA of the source branch.
4. Calls the [GitHub Compare API](https://docs.github.com/en/rest/commits/commits#compare-two-commits) (`GET /repos/{owner}/{repo}/compare/{basehead}`) using the destination branch as the base and the source branch's HEAD SHA as the head.
5. Interprets the API response:
   - `ahead` or `identical` - source contains all commits from destination, action succeeds.
   - `behind` or `diverged` - source is missing commits from destination, action fails with a message suggesting a merge or rebase.
   - `shaApiError` - the GitHub SHA API call failed (e.g. network issue, invalid token, or branch not found).
   - `compareApiError` - the GitHub Compare API call failed (e.g. network issue or invalid token).
   - `unknownStatus` or `unexpectedException` - should never happen under normal conditions. If you see these, it is probably a bug in the action itself - please open an issue.
6. Sets the `status` output in all cases so downstream steps can branch on the result.

## Why not `git fetch`?

An alternative implementation could check out the repo and use `git fetch` + `git log` to compare branches. The GitHub Compare API does the same thing under the hood - it runs the git comparison on GitHub's servers where the repo already lives. The difference is **where** the work happens:

- **`git fetch` approach** - GitHub transfers git objects to your runner over the network. You need `actions/checkout` with `fetch-depth: 0` to get full history. On large repos this means downloading potentially gigabytes of data before the comparison can even start.
- **API approach** - GitHub runs the comparison on their side and returns a single JSON response. No git objects are transferred, no checkout is needed, and the result is instant regardless of repo size or history depth.

---

Copyright (c) 2022-2026 Marian Kostyk.
