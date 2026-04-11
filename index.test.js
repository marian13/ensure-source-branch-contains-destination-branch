import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@actions/github', () => ({
  context: {
    repo: { owner: 'marian13', repo: 'convenient_service' },
    sha: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
  },
  getOctokit: vi.fn(),
}));

import * as core from '@actions/core';
import * as github from '@actions/github';
import { main } from './index.js';

describe('GitHub Action', () => {
  describe('marian13/ensure-source-branch-contains-destination-branch GitHub Action', () => {
    describe('v1', () => {
      const ENV = {
        'INPUT_SOURCE-BRANCH': 'feature/callbacks',
        'INPUT_DESTINATION-BRANCH': 'main',
        INPUT_TOKEN: 'ghp_aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890',
      };

      beforeEach(() => {
        vi.restoreAllMocks();

        Object.assign(process.env, ENV);

        vi.spyOn(core, 'info');
        vi.spyOn(core, 'setFailed');
        vi.spyOn(core, 'debug');

        github.getOctokit.mockReturnValue({
          rest: {
            repos: {
              compareCommitsWithBasehead: vi.fn().mockResolvedValue({
                data: { status: 'ahead' },
              }),
            },
          },
        });
      });

      afterEach(() => {
        Object.keys(ENV).forEach((key) => delete process.env[key]);

        vi.restoreAllMocks();
      });

      describe('when source-branch is not passed', () => {
        beforeEach(() => {
          delete process.env['INPUT_SOURCE-BRANCH'];
        });

        test('it fails', async () => {
          await expect(main()).rejects.toThrow('source-branch');
        });
      });

      describe('when destination-branch is not passed', () => {
        beforeEach(() => {
          delete process.env['INPUT_DESTINATION-BRANCH'];
        });

        test('it fails', async () => {
          await expect(main()).rejects.toThrow('destination-branch');
        });
      });

      describe('when token is not passed', () => {
        beforeEach(() => {
          delete process.env['INPUT_TOKEN'];
        });

        test('it fails', async () => {
          await expect(main()).rejects.toThrow('token');
        });
      });

      describe('when source and destination are same branch', () => {
        beforeEach(() => {
          process.env['INPUT_SOURCE-BRANCH'] = 'main';
          process.env['INPUT_DESTINATION-BRANCH'] = 'main';
        });

        test('it succeeds', async () => {
          await main();

          expect(core.setFailed).not.toHaveBeenCalled();
        });

        test('it logs info message', async () => {
          await main();

          expect(core.info).toHaveBeenCalledWith(
            expect.stringContaining("both 'main'"),
          );
        });
      });

      describe('when compare API fails', () => {
        beforeEach(() => {
          github.getOctokit.mockReturnValue({
            rest: {
              repos: {
                compareCommitsWithBasehead: vi
                  .fn()
                  .mockRejectedValue(new Error('API error')),
              },
            },
          });
        });

        test('it fails', async () => {
          await main();

          expect(core.setFailed).toHaveBeenCalledWith(
            "[ensure-source-branch-contains-destination-branch] GitHub Compare API call failed for 'feature/callbacks...main': API error",
          );
        });

        test('it fails with message', async () => {
          await main();

          expect(core.setFailed).toHaveBeenCalledWith(
            expect.stringContaining('API error'),
          );
        });

        describe('when ACTIONS_STEP_DEBUG is set', () => {
          beforeEach(() => {
            process.env['ACTIONS_STEP_DEBUG'] = 'true';
          });

          afterEach(() => {
            delete process.env['ACTIONS_STEP_DEBUG'];
          });

          test('it logs exception stack trace', async () => {
            await main();

            expect(core.debug).toHaveBeenCalledWith(
              expect.stringContaining('Error: API error'),
            );
          });
        });
      });

      describe('when source branch is ahead of destination branch', () => {
        beforeEach(() => {
          github.getOctokit.mockReturnValue({
            rest: {
              repos: {
                compareCommitsWithBasehead: vi
                  .fn()
                  .mockResolvedValue({ data: { status: 'ahead' } }),
              },
            },
          });
        });

        test('it succeeds', async () => {
          await main();

          expect(core.setFailed).not.toHaveBeenCalled();
        });

        test('it logs info message', async () => {
          await main();

          expect(core.info).toHaveBeenCalledWith(
            expect.stringContaining('status: ahead'),
          );
        });
      });

      describe('when source branch is identical to destination branch commits', () => {
        beforeEach(() => {
          github.getOctokit.mockReturnValue({
            rest: {
              repos: {
                compareCommitsWithBasehead: vi
                  .fn()
                  .mockResolvedValue({ data: { status: 'identical' } }),
              },
            },
          });
        });

        test('it succeeds', async () => {
          await main();

          expect(core.setFailed).not.toHaveBeenCalled();
        });

        test('it logs info message', async () => {
          await main();

          expect(core.info).toHaveBeenCalledWith(
            expect.stringContaining('status: identical'),
          );
        });
      });

      describe('when source branch is behind destination branch', () => {
        beforeEach(() => {
          github.getOctokit.mockReturnValue({
            rest: {
              repos: {
                compareCommitsWithBasehead: vi
                  .fn()
                  .mockResolvedValue({ data: { status: 'behind' } }),
              },
            },
          });
        });

        test('it fails', async () => {
          await main();

          expect(core.setFailed).toHaveBeenCalledWith(
            "[ensure-source-branch-contains-destination-branch] Source branch 'feature/callbacks' must contain destination branch 'main' (compare status: behind). Merge or rebase 'main' into 'feature/callbacks'.",
          );
        });

        test('it fails with message', async () => {
          await main();

          expect(core.setFailed).toHaveBeenCalledWith(
            expect.stringContaining('behind'),
          );
        });
      });

      describe('when source branch is diverged from destination branch', () => {
        beforeEach(() => {
          github.getOctokit.mockReturnValue({
            rest: {
              repos: {
                compareCommitsWithBasehead: vi
                  .fn()
                  .mockResolvedValue({ data: { status: 'diverged' } }),
              },
            },
          });
        });

        test('it fails', async () => {
          await main();

          expect(core.setFailed).toHaveBeenCalledWith(
            "[ensure-source-branch-contains-destination-branch] Source branch 'feature/callbacks' must contain destination branch 'main' (compare status: diverged). Merge or rebase 'main' into 'feature/callbacks'.",
          );
        });

        test('it fails with message', async () => {
          await main();

          expect(core.setFailed).toHaveBeenCalledWith(
            expect.stringContaining('diverged'),
          );
        });
      });

      describe('when compare returns unexpected status', () => {
        beforeEach(() => {
          github.getOctokit.mockReturnValue({
            rest: {
              repos: {
                compareCommitsWithBasehead: vi
                  .fn()
                  .mockResolvedValue({ data: { status: 'unknown' } }),
              },
            },
          });
        });

        test('it fails', async () => {
          await main();

          expect(core.setFailed).toHaveBeenCalledWith(
            "[ensure-source-branch-contains-destination-branch] Unexpected compare status: 'unknown'.",
          );
        });

        test('it fails with message', async () => {
          await main();

          expect(core.setFailed).toHaveBeenCalledWith(
            expect.stringContaining('Unexpected'),
          );
        });
      });

      describe('when unexpected exception is raised', () => {
        beforeEach(() => {
          github.getOctokit.mockImplementation(() => {
            throw new Error('Unexpected error');
          });
        });

        test('it fails', async () => {
          await expect(main()).rejects.toThrow('Unexpected error');
        });

        describe('when ACTIONS_STEP_DEBUG is set', () => {
          beforeEach(() => {
            process.env['ACTIONS_STEP_DEBUG'] = 'true';
          });

          afterEach(() => {
            delete process.env['ACTIONS_STEP_DEBUG'];
          });

          test('it logs exception stack trace', async () => {
            await expect(main()).rejects.toThrow('Unexpected error');

            expect(core.debug).not.toHaveBeenCalled();
          });
        });
      });
    });
  });
});
