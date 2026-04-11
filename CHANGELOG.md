# Changelog

## 1.0.0 (2026-04-11)

### Features

- Verify that source branch contains all commits from destination branch before merging.
- Support `source-branch` input (defaults to `github.ref_name`).
- Support `destination-branch` input (defaults to `github.event.repository.default_branch`).
- Support `token` input for authenticating SHA API and Compare API calls (defaults to `github.token`). Token is masked in logs via `core.setSecret`.
- Support `tag` input to prepend a custom tag to all log messages. Set to empty string to log without a tag.
- Expose `status` output with one of: `sameBranch`, `ahead`, `identical`, `behind`, `diverged`, `shaApiError`, `compareApiError`, `unknownStatus`, `unexpectedException`.
- Exit early with `status: sameBranch` when source and destination are the same branch.
- Fail with actionable message on `behind` or `diverged`, suggesting a merge or rebase.
- Log resolved SHA and basehead string at debug level for diagnosability.
