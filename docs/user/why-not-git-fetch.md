# Why not `git fetch`?

An alternative implementation could check out the repo and use `git fetch` + `git log` to compare branches locally. This action uses the GitHub Compare API instead, which likely performs the same comparison on GitHub's servers. The key difference is **where** the work happens:

- **`git fetch` approach** - GitHub transfers git objects to your runner over the network. You need `actions/checkout` with `fetch-depth: 0` to get full history. On large repos this means downloading potentially gigabytes of data before the comparison can even start.
- **API approach** - GitHub runs the comparison on their side and returns a single JSON response. No git objects are transferred, no checkout is needed, and the result is instant regardless of repo size or history depth.
