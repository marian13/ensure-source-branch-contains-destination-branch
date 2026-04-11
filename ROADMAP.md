# Roadmap

## Ideas

### Retry logic for transient API errors

Both `resolveSha` and `resolveCompareApiData` currently treat all errors the same - a 429 (rate limit), 500 (server error), or network timeout silently becomes `shaApiError` / `compareApiError` with no retry. A retry with exponential backoff would make the action resilient to transient failures without requiring a re-run.

### Separation of API error statuses

Currently `shaApiError` and `compareApiError` each cover all failure modes - a 404 (branch not found), 403 (insufficient permissions), 429 (rate limited), and 500 (server error) are all indistinguishable from the outside. Splitting into more granular statuses (e.g. `branchNotFound`, `rateLimited`, `serverError`) would allow downstream steps to react differently depending on the cause.
