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

Also inputs and outputs are available. All of them are optional by default.

```yaml
steps:
  # ...
  - uses: marian13/ensure-source-branch-contains-destination-branch@v1
  # ...
```

## How does it work?

---

Copyright (c) 2022-2026 Marian Kostyk.

