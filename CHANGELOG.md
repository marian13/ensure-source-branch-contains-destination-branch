# Changelog

## 1.0.0-alpha.1 (2026-04-12)


### Features

* **ensure-source-branch-contains-destination-branch:** initial release ([6b94535](https://github.com/marian13/ensure-source-branch-contains-destination-branch/commit/6b9453570c664f8cf1c9d195fb9ed81b8486809f))


### Bug Fixes

* **ensure-source-branch-contains-destination-branch:** use proper defaults for PRs ([dacf739](https://github.com/marian13/ensure-source-branch-contains-destination-branch/commit/dacf739fee72542c84aec52ec291a54d0594123d))


### Miscellaneous Chores

* release 1.0.0-alpha.1 ([e3db950](https://github.com/marian13/ensure-source-branch-contains-destination-branch/commit/e3db950153cb5ef110d22d201fc6b225fd2afc51))

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
- Log resolved SHA and basehead string at debug level for easier debugging.
