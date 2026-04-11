# How does it work?

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
