import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@actions/core", async (importOriginal) => ({
  ...(await importOriginal()),
}));

vi.mock("@actions/github", () => ({
  context: {
    repo: { owner: "marian13", repo: "convenient_service" },
    ref: "refs/heads/feature/callbacks",
    sha: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
    eventName: "push",
  },
  getOctokit: vi.fn(),
}));

import * as core from "@actions/core";
import * as github from "@actions/github";
import { main } from "./index.js";

describe("GitHub Action", () => {
  describe("marian13/ensure-source-branch-contains-destination-branch GitHub Action", () => {
    describe("v1", () => {
      const ENV = {
        "INPUT_SOURCE-BRANCH": "feature/callbacks",
        "INPUT_DESTINATION-BRANCH": "main",
        INPUT_TOKEN: "ghp_aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890",
        INPUT_TAG: "ensure-source-branch-contains-destination-branch",
      };

      beforeEach(() => {
        vi.restoreAllMocks();

        Object.assign(process.env, ENV);

        vi.spyOn(core, "info");
        vi.spyOn(core, "setFailed");
        vi.spyOn(core, "setOutput");
        vi.spyOn(core, "setSecret");
        vi.spyOn(core, "debug");

        github.getOctokit.mockReturnValue({
          rest: {
            git: {
              getRef: vi.fn(),
            },
            repos: {
              compareCommitsWithBasehead: vi.fn().mockResolvedValue({
                data: { status: "ahead" },
              }),
            },
          },
        });
      });

      afterEach(() => {
        Object.keys(ENV).forEach((key) => delete process.env[key]);

        vi.restoreAllMocks();
      });

      describe("when source-branch is not passed", () => {
        beforeEach(() => {
          delete process.env["INPUT_SOURCE-BRANCH"];
        });

        test("it fails", async () => {
          await expect(main()).rejects.toThrow("source-branch");
        });
      });

      describe("when destination-branch is not passed", () => {
        beforeEach(() => {
          delete process.env["INPUT_DESTINATION-BRANCH"];
        });

        test("it fails", async () => {
          await expect(main()).rejects.toThrow("destination-branch");
        });
      });

      describe("when token is not passed", () => {
        beforeEach(() => {
          delete process.env["INPUT_TOKEN"];
        });

        test("it fails", async () => {
          await expect(main()).rejects.toThrow("token");
        });
      });

      describe("when token is passed", () => {
        test("it masks the token", async () => {
          await main();

          expect(core.setSecret).toHaveBeenCalledWith(
            "ghp_aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890",
          );
        });
      });

      describe("when source and destination are same branch", () => {
        beforeEach(() => {
          process.env["INPUT_SOURCE-BRANCH"] = "main";
          process.env["INPUT_DESTINATION-BRANCH"] = "main";
        });

        test("it succeeds", async () => {
          await main();

          expect(core.setFailed).not.toHaveBeenCalled();
        });

        test("it logs info message", async () => {
          await main();

          expect(core.info).toHaveBeenCalledWith(
            expect.stringContaining("both 'main'"),
          );
        });

        test("it sets status to sameBranch", async () => {
          await main();

          expect(core.setOutput).toHaveBeenCalledWith("status", "sameBranch");
        });
      });

      describe("when SHA API fails", () => {
        beforeEach(() => {
          github.getOctokit.mockReturnValue({
            rest: {
              git: {
                getRef: vi.fn().mockRejectedValue(new Error("API error")),
              },
              repos: {
                compareCommitsWithBasehead: vi.fn(),
              },
            },
          });

          process.env["INPUT_SOURCE-BRANCH"] = "feature/other-branch";
        });

        test("it fails", async () => {
          await main();

          expect(core.setFailed).toHaveBeenCalledWith(
            "[ensure-source-branch-contains-destination-branch] Failed to resolve SHA for source branch 'feature/other-branch'.",
          );
        });

        test("it sets status to shaApiError", async () => {
          await main();

          expect(core.setOutput).toHaveBeenCalledWith("status", "shaApiError");
        });

        describe("when ACTIONS_STEP_DEBUG is set", () => {
          beforeEach(() => {
            process.env["ACTIONS_STEP_DEBUG"] = "true";
          });

          afterEach(() => {
            delete process.env["ACTIONS_STEP_DEBUG"];
          });

          test("it logs exception stack trace", async () => {
            await main();

            expect(core.debug).toHaveBeenCalledWith(
              expect.stringContaining("Error: API error"),
            );
          });
        });
      });

      describe("when event is pull_request", () => {
        beforeEach(() => {
          github.context.eventName = "pull_request";

          github.getOctokit.mockReturnValue({
            rest: {
              git: {
                getRef: vi.fn().mockResolvedValue({
                  data: {
                    object: { sha: "b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3" },
                  },
                }),
              },
              repos: {
                compareCommitsWithBasehead: vi.fn().mockResolvedValue({
                  data: { status: "ahead" },
                }),
              },
            },
          });
        });

        afterEach(() => {
          github.context.eventName = "push";
        });

        test("it resolves SHA via API instead of using context.sha", async () => {
          await main();

          expect(core.debug).toHaveBeenCalledWith(
            expect.stringContaining("b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3"),
          );
        });

        test("it logs resolved SHA", async () => {
          await main();

          expect(core.debug).toHaveBeenCalledWith(
            "[ensure-source-branch-contains-destination-branch] Resolved SHA for 'feature/callbacks': b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3.",
          );
        });

        test("it logs basehead string", async () => {
          await main();

          expect(core.debug).toHaveBeenCalledWith(
            "[ensure-source-branch-contains-destination-branch] Comparing 'main...b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3'.",
          );
        });

        test("it does not use context.sha", async () => {
          await main();

          expect(core.debug).not.toHaveBeenCalledWith(
            expect.stringContaining("a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2"),
          );
        });
      });

      describe("when compare API fails", () => {
        beforeEach(() => {
          github.getOctokit.mockReturnValue({
            rest: {
              repos: {
                compareCommitsWithBasehead: vi
                  .fn()
                  .mockRejectedValue(new Error("API error")),
              },
            },
          });
        });

        test("it fails", async () => {
          await main();

          expect(core.setFailed).toHaveBeenCalledWith(
            "[ensure-source-branch-contains-destination-branch] GitHub Compare API call failed for 'main...feature/callbacks'.",
          );
        });

        test("it sets status to compareApiError", async () => {
          await main();

          expect(core.setOutput).toHaveBeenCalledWith(
            "status",
            "compareApiError",
          );
        });

        describe("when ACTIONS_STEP_DEBUG is set", () => {
          beforeEach(() => {
            process.env["ACTIONS_STEP_DEBUG"] = "true";
          });

          afterEach(() => {
            delete process.env["ACTIONS_STEP_DEBUG"];
          });

          test("it logs exception stack trace", async () => {
            await main();

            expect(core.debug).toHaveBeenCalledWith(
              expect.stringContaining("Error: API error"),
            );
          });
        });
      });

      describe("when source branch is ahead of destination branch", () => {
        beforeEach(() => {
          github.getOctokit.mockReturnValue({
            rest: {
              repos: {
                compareCommitsWithBasehead: vi
                  .fn()
                  .mockResolvedValue({ data: { status: "ahead" } }),
              },
            },
          });
        });

        test("it succeeds", async () => {
          await main();

          expect(core.setFailed).not.toHaveBeenCalled();
        });

        test("it logs info message", async () => {
          await main();

          expect(core.info).toHaveBeenCalledWith(
            expect.stringContaining("status: ahead"),
          );
        });

        test("it sets status to ahead", async () => {
          await main();

          expect(core.setOutput).toHaveBeenCalledWith("status", "ahead");
        });

        test("it logs resolved SHA", async () => {
          await main();

          expect(core.debug).toHaveBeenCalledWith(
            "[ensure-source-branch-contains-destination-branch] Resolved SHA for 'feature/callbacks': a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2.",
          );
        });

        test("it logs basehead string", async () => {
          await main();

          expect(core.debug).toHaveBeenCalledWith(
            "[ensure-source-branch-contains-destination-branch] Comparing 'main...a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2'.",
          );
        });
      });

      describe("when source branch is identical to destination branch commits", () => {
        beforeEach(() => {
          github.getOctokit.mockReturnValue({
            rest: {
              repos: {
                compareCommitsWithBasehead: vi
                  .fn()
                  .mockResolvedValue({ data: { status: "identical" } }),
              },
            },
          });
        });

        test("it succeeds", async () => {
          await main();

          expect(core.setFailed).not.toHaveBeenCalled();
        });

        test("it logs info message", async () => {
          await main();

          expect(core.info).toHaveBeenCalledWith(
            expect.stringContaining("status: identical"),
          );
        });

        test("it sets status to identical", async () => {
          await main();

          expect(core.setOutput).toHaveBeenCalledWith("status", "identical");
        });
      });

      describe("when source branch is behind destination branch", () => {
        beforeEach(() => {
          github.getOctokit.mockReturnValue({
            rest: {
              repos: {
                compareCommitsWithBasehead: vi
                  .fn()
                  .mockResolvedValue({ data: { status: "behind" } }),
              },
            },
          });
        });

        test("it fails", async () => {
          await main();

          expect(core.setFailed).toHaveBeenCalledWith(
            "[ensure-source-branch-contains-destination-branch] Source branch 'feature/callbacks' must contain destination branch 'main' (compare status: behind). Merge or rebase 'main' into 'feature/callbacks'.",
          );
        });

        test("it sets status to behind", async () => {
          await main();

          expect(core.setOutput).toHaveBeenCalledWith("status", "behind");
        });
      });

      describe("when source branch is diverged from destination branch", () => {
        beforeEach(() => {
          github.getOctokit.mockReturnValue({
            rest: {
              repos: {
                compareCommitsWithBasehead: vi
                  .fn()
                  .mockResolvedValue({ data: { status: "diverged" } }),
              },
            },
          });
        });

        test("it fails", async () => {
          await main();

          expect(core.setFailed).toHaveBeenCalledWith(
            "[ensure-source-branch-contains-destination-branch] Source branch 'feature/callbacks' must contain destination branch 'main' (compare status: diverged). Merge or rebase 'main' into 'feature/callbacks'.",
          );
        });

        test("it sets status to diverged", async () => {
          await main();

          expect(core.setOutput).toHaveBeenCalledWith("status", "diverged");
        });
      });

      describe("when compare returns unexpected status", () => {
        beforeEach(() => {
          github.getOctokit.mockReturnValue({
            rest: {
              repos: {
                compareCommitsWithBasehead: vi
                  .fn()
                  .mockResolvedValue({ data: { status: "unknown" } }),
              },
            },
          });
        });

        test("it fails", async () => {
          await main();

          expect(core.setFailed).toHaveBeenCalledWith(
            "[ensure-source-branch-contains-destination-branch] Unexpected compare status: 'unknown'.",
          );
        });

        test("it sets status to unknownStatus", async () => {
          await main();

          expect(core.setOutput).toHaveBeenCalledWith(
            "status",
            "unknownStatus",
          );
        });
      });

      describe("when unexpected exception is raised", () => {
        beforeEach(() => {
          github.getOctokit.mockImplementation(() => {
            throw new Error("Unexpected error");
          });
        });

        test("it fails", async () => {
          await main();

          expect(core.setFailed).toHaveBeenCalledWith(
            expect.stringContaining("Unexpected error"),
          );
        });

        test("it sets status to unexpectedException", async () => {
          await main();

          expect(core.setOutput).toHaveBeenCalledWith(
            "status",
            "unexpectedException",
          );
        });

        describe("when ACTIONS_STEP_DEBUG is set", () => {
          beforeEach(() => {
            process.env["ACTIONS_STEP_DEBUG"] = "true";
          });

          afterEach(() => {
            delete process.env["ACTIONS_STEP_DEBUG"];
          });

          test("it logs exception stack trace", async () => {
            await main();

            expect(core.debug).toHaveBeenCalledWith(
              expect.stringContaining("Error: Unexpected error"),
            );
          });
        });
      });

      describe("when tag is custom", () => {
        beforeEach(() => {
          process.env["INPUT_TAG"] = "my-custom-tag";
        });

        test("it prepends custom tag to log messages", async () => {
          await main();

          expect(core.info).toHaveBeenCalledWith(
            expect.stringContaining("[my-custom-tag]"),
          );
        });
      });

      describe("when tag is empty", () => {
        beforeEach(() => {
          process.env["INPUT_TAG"] = "";
        });

        test("it logs messages without a tag", async () => {
          await main();

          expect(core.info).toHaveBeenCalledWith(
            expect.not.stringContaining("["),
          );
        });
      });
    });
  });
});
