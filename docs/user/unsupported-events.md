# What Happens on Unsupported Events?

This action currently supports `push` and `pull_request` events. For these events, `source-branch` and `destination-branch` are resolved automatically from the event payload if not explicitly provided.

For any other event (e.g. `merge_group`, `workflow_dispatch`, `schedule`), the action has no built-in defaults. If `source-branch` or `destination-branch` are not passed explicitly, the action will throw:

```
Input required and not supplied: source-branch
```

On unsupported events, the source branch SHA is always resolved via the GitHub API rather than from `github.context.sha`. On `push` events `github.context.sha` is the real HEAD of the branch. On other events it may point to a synthetic merge commit created by GitHub (e.g. `refs/pull/9/merge` on `pull_request`), which includes commits from the base branch and does not represent the real HEAD of the source branch. See [actions/checkout#504](https://github.com/actions/checkout/issues/504) and the [actions/checkout README](https://github.com/actions/checkout#checkout-pull-request-head-commit-instead-of-merge-commit) for more context.

To use the action on an unsupported event, pass both inputs explicitly:

```yaml
- uses: marian13/ensure-source-branch-contains-destination-branch@v1
  with:
    source-branch: my-feature
    destination-branch: main
```
