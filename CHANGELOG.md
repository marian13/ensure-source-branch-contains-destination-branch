# Changelog

## [1.0.1](https://github.com/marian13/ensure-source-branch-contains-destination-branch/compare/v1.0.0...v1.0.1) (2026-04-12)


### Miscellaneous Chores

* release 1.0.1 ([c7c1ef1](https://github.com/marian13/ensure-source-branch-contains-destination-branch/commit/c7c1ef1e1f440f3abe89605573dce1b95b63363d))

## [1.0.0](https://github.com/marian13/ensure-source-branch-contains-destination-branch/compare/v1.0.0-alpha.1...v1.0.0) (2026-04-12)


### Miscellaneous Chores

* release 1.0.0 ([2f40796](https://github.com/marian13/ensure-source-branch-contains-destination-branch/commit/2f407961abf51d4c527f0499114d24f800132f25))

## 1.0.0-alpha.1 (2026-04-12)

### Features

- Verify that source branch contains all commits from destination branch before merging.
- Support `source-branch` input.
- Support `destination-branch` input.
- Support `token` input for authenticating SHA API and Compare API calls. Token is masked in logs via `core.setSecret`.
- Support `tag` input to prepend a custom tag to all log messages. Set to empty string to log without a tag.
- Expose `status` output with one of: `sameBranch`, `ahead`, `identical`, `behind`, `diverged`, `shaApiError`, `compareApiError`, `unknownStatus`, `unexpectedException`.
- Exit early with `status: sameBranch` when source and destination are the same branch.
- Fail with actionable message on `behind` or `diverged`, suggesting a merge or rebase.
- Log resolved SHA and basehead string at debug level for easier debugging.
