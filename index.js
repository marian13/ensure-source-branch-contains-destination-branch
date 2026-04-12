/**
 * NOTE: `@actions/core` is used to get action inputs and set its outputs.
 * - https://github.com/actions/toolkit/tree/main/packages/core
 */
import * as core from "@actions/core";

/**
 * NOTE: `@actions/github` is used to send requests to GitHub Compare API.
 * - https://docs.github.com/en/rest/commits/commits?apiVersion=2026-03-10#compare-two-commits
 * - https://github.com/actions/toolkit/tree/main/packages/github
 */
import * as github from "@actions/github";

/**
 * NOTE: `pathToFileURL` is used to detect if this file is run directly.
 * - https://nodejs.org/api/url.html#urlpathtofileurlpath
 */
import { pathToFileURL } from "url";

/**
 * NOTE: Extracts the plain branch name from `github.context.ref` (e.g. `refs/heads/some-feature` -> `some-feature`).
 */
function currentBranch() {
  return github.context.ref.replace("refs/heads/", "");
}

/**
 * NOTE: On `push` events, falls back to the current branch name derived from `github.context.ref`.
 * NOTE: On `pull_request` events, falls back to the real head branch from the event payload.
 * NOTE: On unsupported events, `source-branch` must be passed explicitly — throws if missing.
 */
function resolveSourceBranch() {
  if (github.context.eventName === "push") {
    return core.getInput("source-branch") || currentBranch();
  }

  if (github.context.eventName === "pull_request") {
    return (
      core.getInput("source-branch") ||
      github.context.payload.pull_request.head.ref
    );
  }

  return core.getInput("source-branch", { required: true });
}

/**
 * NOTE: On `push` events, falls back to the repository default branch.
 * NOTE: On `pull_request` events, falls back to the base branch from the event payload.
 * NOTE: On unsupported events, `destination-branch` must be passed explicitly — throws if missing.
 */
function resolveDestinationBranch() {
  if (github.context.eventName === "push") {
    return (
      core.getInput("destination-branch") ||
      github.context.payload.repository.default_branch
    );
  }

  if (github.context.eventName === "pull_request") {
    return (
      core.getInput("destination-branch") ||
      github.context.payload.pull_request.base.ref
    );
  }

  return core.getInput("destination-branch", { required: true });
}

/**
 * NOTE: `sha` is the full commit hash of the HEAD commit on the source branch. For example: `a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2`.
 * NOTE: On `push` events, `github.context.sha` is the real HEAD SHA and is safe to use directly.
 * NOTE: On `pull_request` events, `github.context.sha` points to a synthetic merge commit - the result of merging the source branch into the destination branch. That commit always contains the destination branch by definition, so using it would cause a false positive. The real HEAD SHA must be fetched via the API instead.
 * - https://docs.github.com/en/pull-requests/committing-changes-to-your-project/creating-and-editing-commits/about-commits#about-commits
 * - https://github.com/actions/toolkit/blob/%40actions/github%401.1.0/packages/github/src/context.ts#L38
 */
async function resolveSha({ octokit, repo, sourceBranch }) {
  if (github.context.eventName === "push" && sourceBranch === currentBranch()) {
    return github.context.sha;
  }

  try {
    const { data: ref } = await octokit.rest.git.getRef({
      owner: repo.owner,
      repo: repo.repo,
      ref: `heads/${sourceBranch}`,
    });

    return ref.object.sha;
  } catch (exception) {
    core.debug(exception.stack);

    return "";
  }
}

/**
 * NOTE: Calls the GitHub Compare API to determine the relationship between the destination branch and the source SHA.
 * NOTE: The basehead format is `base...head`, where `destinationBranch` is the base and `sha` is the head.
 * NOTE: `ahead` means the source SHA has commits not in the destination — i.e. source contains destination. This is the passing case.
 * NOTE: `behind` means the destination has commits not in the source — i.e. source is missing commits. This is the failing case.
 * NOTE: Returns the response data object on success, or `{}` on failure (the natural empty value for an object return type).
 * - https://docs.github.com/en/rest/commits/commits?apiVersion=2026-03-10#compare-two-commits
 */
async function resolveCompareApiData({
  octokit,
  repo,
  destinationBranch,
  sha,
}) {
  try {
    const { data } = await octokit.rest.repos.compareCommitsWithBasehead({
      owner: repo.owner,
      repo: repo.repo,
      basehead: `${destinationBranch}...${sha}`,
    });

    return data;
  } catch (exception) {
    core.debug(exception.stack);

    return {};
  }
}

export async function main() {
  const sourceBranch = resolveSourceBranch();
  const destinationBranch = resolveDestinationBranch();
  const token = core.getInput("token", { required: true });
  const tag = core.getInput("tag");

  const toMessage = (text) => (tag ? `[${tag}] ${text}` : text);

  /**
   * NOTE: `core.setSecret` masks the token in all subsequent log output.
   * NOTE: GitHub Actions only auto-masks values from `secrets` context. Tokens passed as plain inputs (e.g. a PAT) would otherwise be logged in plain text.
   * - https://github.com/actions/toolkit/tree/main/packages/core#setting-a-secret
   */
  core.setSecret(token);

  try {
    if (sourceBranch === destinationBranch) {
      core.setOutput("status", "sameBranch");

      core.info(
        toMessage(
          `Source branch and destination branch are both '${sourceBranch}'. Nothing to check.`,
        ),
      );

      return;
    }

    const { repo } = github.context;
    const octokit = github.getOctokit(token);

    const sha = await resolveSha({ octokit, repo, sourceBranch });

    if (!sha) {
      core.setOutput("status", "shaApiError");

      core.setFailed(
        toMessage(`Failed to resolve SHA for source branch '${sourceBranch}'.`),
      );

      return;
    }

    core.debug(toMessage(`Resolved SHA for '${sourceBranch}': ${sha}.`));
    core.debug(toMessage(`Comparing '${destinationBranch}...${sha}'.`));

    const data = await resolveCompareApiData({
      octokit,
      repo,
      destinationBranch,
      sha,
    });

    if (!data.status) {
      core.setOutput("status", "compareApiError");

      core.setFailed(
        toMessage(
          `GitHub Compare API call failed for '${destinationBranch}...${sourceBranch}'.`,
        ),
      );

      return;
    }

    if (data.status === "ahead" || data.status === "identical") {
      core.setOutput("status", data.status);

      core.info(
        toMessage(
          `Source branch '${sourceBranch}' contains destination branch '${destinationBranch}' (status: ${data.status}).`,
        ),
      );

      return;
    }

    if (data.status === "behind" || data.status === "diverged") {
      core.setOutput("status", data.status);

      core.setFailed(
        toMessage(
          `Source branch '${sourceBranch}' must contain destination branch '${destinationBranch}' (compare status: ${data.status}). Merge or rebase '${destinationBranch}' into '${sourceBranch}'.`,
        ),
      );

      return;
    }

    core.setOutput("status", "unknownStatus");

    core.setFailed(toMessage(`Unexpected compare status: '${data.status}'.`));
  } catch (exception) {
    core.setOutput("status", "unexpectedException");

    core.setFailed(toMessage(exception.message));

    core.debug(exception.stack);
  }
}

/**
 * NOTE: Checks whether this file is run from command line.
 * NOTE: There is no need to immediately invoke `main` in unit tests.
 * - https://stackoverflow.com/a/68848622/12201472
 */
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
