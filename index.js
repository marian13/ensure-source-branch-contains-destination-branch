/**
 * NOTE: `@actions/core` is used to get action inputs and set its outputs.
 * - https://github.com/actions/toolkit/tree/main/packages/core
 */
import * as core from '@actions/core';

/**
 * NOTE: `@actions/github` is used to send requests to GitHub Compare AI.
 * - https://docs.github.com/en/rest/commits/commits?apiVersion=2026-03-10#compare-two-commits
 * - https://github.com/actions/toolkit/tree/main/packages/github
 */
import * as github from '@actions/github';

/**
 * NOTE: `pathToFileURL` is used to detect if this file is run directly.
 * - https://nodejs.org/api/url.html#urlpathtofileurlpath
 */
import { pathToFileURL } from 'url';

const ACTION = 'ensure-source-branch-contains-destination-branch';

export async function main() {
  const sourceBranch = core.getInput('source-branch', { required: true });
  const destinationBranch = core.getInput('destination-branch', { required: true });
  const token = core.getInput('token', { required: true });

  if (sourceBranch === destinationBranch) {
    core.info(`[${ACTION}] Source branch and destination branch are both '${sourceBranch}'. Nothing to check.`);

    return;
  }

  /**
   * NOTE: `sha` is the full commit hash of the HEAD commit on the source branch. For example: `a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2`.
   * - https://docs.github.com/en/pull-requests/committing-changes-to-your-project/creating-and-editing-commits/about-commits#about-commits
   * - https://github.com/actions/toolkit/blob/%40actions/github%401.1.0/packages/github/src/context.ts#L38
   */
  const { repo, sha } = github.context;
  const octokit = github.getOctokit(token);

  let data;

  try {
    ({ data } = await octokit.rest.repos.compareCommitsWithBasehead({
      owner: repo.owner,
      repo: repo.repo,
      basehead: `${destinationBranch}...${sha}`,
    }));
  } catch (exception) {
    core.setFailed(`[${ACTION}] GitHub Compare API call failed for '${sourceBranch}...${destinationBranch}': ${exception.message}`);

    /**
     * NOTE: Use `ACTIONS_RUNNER_DEBUG` to enable debug logs.
     * - https://docs.github.com/en/actions/how-tos/monitor-workflows/enable-debug-logging#enabling-runner-diagnostic-logging
     */
    core.debug(exception.stack);

    return;
  }

  if (data.status === 'ahead' || data.status === 'identical') {
    core.info(`[${ACTION}] Source branch '${sourceBranch}' contains destination branch '${destinationBranch}' (status: ${data.status}).`);

    return;
  }

  if (data.status === 'behind' || data.status === 'diverged') {
    core.setFailed(`[${ACTION}] Source branch '${sourceBranch}' must contain destination branch '${destinationBranch}' (compare status: ${data.status}). Merge or rebase '${destinationBranch}' into '${sourceBranch}'.`);

    return;
  }

  core.setFailed(`[${ACTION}] Unexpected compare status: '${data.status || ''}'.`);
}

/**
 * NOTE: Checks whether this file is run from command line.
 * NOTE: There no need to immediately invoke `main` in unit tests.
 * - https://stackoverflow.com/a/68848622/12201472
 */
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((exception) => {
    core.setFailed(`[${ACTION}] ${exception.message}`);

    core.debug(exception.stack);
  });
}
