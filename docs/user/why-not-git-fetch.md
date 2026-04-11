# Why not `git fetch`?

An alternative implementation could check out the repo and use `git fetch` + `git log` to compare branches. The GitHub Compare API does the same thing under the hood - it runs the git comparison on GitHub's servers where the repo already lives. The difference is **where** the work happens:

- **`git fetch` approach** - GitHub transfers git objects to your runner over the network. You need `actions/checkout` with `fetch-depth: 0` to get full history. On large repos this means downloading potentially gigabytes of data before the comparison can even start.
- **API approach** - GitHub runs the comparison on their side and returns a single JSON response. No git objects are transferred, no checkout is needed, and the result is instant regardless of repo size or history depth.
