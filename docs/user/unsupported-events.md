# What Happens on Unsupported Events?

This action currently supports `push` and `pull_request` events. For these events, `source-branch` and `destination-branch` are resolved automatically from the event payload if not explicitly provided.

For any other event (e.g. `merge_group`, `workflow_dispatch`, `schedule`), the action has no built-in defaults. If `source-branch` or `destination-branch` are not passed explicitly, the action will throw:

```
Input required and not supplied: source-branch
```

To use the action on an unsupported event, pass both inputs explicitly:

```yaml
- uses: marian13/ensure-source-branch-contains-destination-branch@v1
  with:
    source-branch: my-feature
    destination-branch: main
```
