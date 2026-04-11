/**
 * NOTE: `@actions/core` is used to get action inputs and set its outputs.
 * - https://github.com/actions/toolkit/tree/main/packages/core
 */
import * as core from "@actions/core";

/**
 * NOTE: `@actions/github` is used to send requests to GitHub Compare AI.
 * - https://docs.github.com/en/rest/commits/commits?apiVersion=2026-03-10#compare-two-commits
 * - https://github.com/actions/toolkit/tree/main/packages/github
 */
import * as github from "@actions/github";

/**
 * NOTE: `pathToFileURL` is used to detect if this file is run directly.
 * - https://nodejs.org/api/url.html#urlpathtofileurlpath
 */
import { pathToFileURL } from "url";

function prependTag(tag, message) {
  return tag ? `[${tag}] ${message}` : message;
}

/**
 * NOTE: `sha` is the full commit hash of the HEAD commit on the source branch. For example: `a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2`.
 * - https://docs.github.com/en/pull-requests/committing-changes-to-your-project/creating-and-editing-commits/about-commits#about-commits
 * - https://github.com/actions/toolkit/blob/%40actions/github%401.1.0/packages/github/src/context.ts#L38
 */
async function resolveSha({ octokit, repo, sourceBranch }) {
  const currentBranch = github.context.ref.replace("refs/heads/", "");

  if (sourceBranch === currentBranch) {
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

    return null;
  }
}

export async function main() {
  const sourceBranch = core.getInput("source-branch", { required: true });
  const destinationBranch = core.getInput("destination-branch", {
    required: true,
  });
  const token = core.getInput("token", { required: true });
  const tag = core.getInput("tag");

  try {
    if (sourceBranch === destinationBranch) {
      core.setOutput("status", "sameBranch");

      core.info(
        prependTag(
          tag,
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
        prependTag(
          tag,
          `Failed to resolve SHA for source branch '${sourceBranch}'.`,
        ),
      );

      return;
    }

    const data = await resolveCompareApiData({
      octokit,
      repo,
      destinationBranch,
      sha,
    });

    if (!data) {
      core.setOutput("status", "compareApiError");

      core.setFailed(
        prependTag(
          tag,
          `GitHub Compare API call failed for '${sourceBranch}...${destinationBranch}'.`,
        ),
      );

      return;
    }

    if (data.status === "ahead" || data.status === "identical") {
      core.setOutput("status", data.status);

      core.info(
        prependTag(
          tag,
          `Source branch '${sourceBranch}' contains destination branch '${destinationBranch}' (status: ${data.status}).`,
        ),
      );

      return;
    }

    if (data.status === "behind" || data.status === "diverged") {
      core.setOutput("status", data.status);

      core.setFailed(
        prependTag(
          tag,
          `Source branch '${sourceBranch}' must contain destination branch '${destinationBranch}' (compare status: ${data.status}). Merge or rebase '${destinationBranch}' into '${sourceBranch}'.`,
        ),
      );

      return;
    }

    core.setOutput("status", "unknownStatus");

    core.setFailed(
      prependTag(tag, `Unexpected compare status: '${data.status || ""}'.`),
    );
  } catch (exception) {
    core.setOutput("status", "unexpectedException");

    core.setFailed(prependTag(tag, exception.message));

    core.debug(exception.stack);
  }
}

/**
 * NOTE: Checks whether this file is run from command line.
 * NOTE: There no need to immediately invoke `main` in unit tests.
 * - https://stackoverflow.com/a/68848622/12201472
 */
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
