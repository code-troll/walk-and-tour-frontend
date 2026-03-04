# Specific instructions

- Use British English spelling
- Prefer simplicity, readability and maintainability
- Don't use abbreviations, use full words (for example, use `message` instead of `msg`), except for extremely common &
  widely accepted abbreviations (like URL).

# Agent Context

## General

- If available, use the JetBrains MCPs (intellij, pycharm, webstorm).
- Avoid using relative paths, they tend to not work.

## MCP Steps which worked previously

### Run tests

- Try using the jetbrains run configurations to run tests
- Prefer to run unit tests first
- Fallback to readme instructions & makefile targets if run configurations aren't available.

### Fetching Human PR reviews

1. Call mcp__github__pull_request_read (method: get_review_comments) on the target pull request.
2. If the payload exceeds the limit and returns truncated data, rerun the same call with a smaller perPage value (e.g.
   10, then 2) and iterate over increasing page
   numbers until an empty list is returned.
3. Filter the aggregated results client-side to isolate human-authored comments if required.

# Git workflow

Use the git MCP server instead of `git` commands. If a command doesn't exist in the MCP server, resort to `git` CLI
commands.
When using the git MCP, don't use relative paths (as they don't work).
Escalate permissions for git commands (e.g. pull, push and branch) to the user (you don't have permission to run them in
sandbox).

## Branching

- Create feature branches off `main` using conventional branch syntax: e.g.
  `<conventional-branch-topic>/<JIRA-PROJECT-KEY>-<jira-ticket-number>-<short-description>`.
  - If you don't know the ticket number, ask the user for it. Use the branch name
    `<conventional-branch-topic>/NO-JIRA-<short-description>` if the user hasn't got a ticket.
  - Find the Jira project key from the Jira MCP.
  - Ensure the default branch is up to date BEFORE branching.
- Make sure you're on the correct branch *before* committing changes
- Keep commits scoped; write clear messages (e.g., `chore: remove example env`).
  - Use conventional commit style commit messages

## Creating a Pull Request

Use the PR template when available in `.github/pull_request_template.md`. Do not commit temporary files when creating
the template itself.

1) Ensure branch is pushed

2) Prepare PR description

- Copy `.github/pull_request_template.md` contents into a temporary file (with mktemp).
- Before drafting the PR body, compare your branch against the target branch (e.g., `git diff main...`) so the
  description reflects the actual changes that will land.
- Fill in sections: What, Why, Changes, References.
  - Use any context you read from Confluence, Jira or Slack for your references.
  - If you are working from a jira ticket, include it's label (e.g. <JIRA-PROJECT-KEY>-<JIRA-TICKET-NUMBER>)

3) Create the PR

- Use conventional commit style titles for PR names. e.g. '<conventional commit topic>: concice title'
- Mark Draft if not ready; otherwise create as ready for review.
- Add the label `ai: codex` to the pull request. If the label doesn't already exist, create it (colour it white).

4) Finally

- Remove any temporary PR body file from the working tree after creating or updating the PR.

## Updating a Pull Request

If you push new commits to a branch with an open Pull Request, ensure the below instructions are followed.

1) Merge from remote

2) Perform changes

3) Commit

4) Push

5) Regenerate PR description (same instructions as above)

- Before drafting the PR body, compare your branch against the target branch so the description reflects the actual
  changes that will land.

6) Apply PR description update

7) Remove temporary PR description

## After Merging

Syncrhonise the default branch with the changes from the remote repo.

## Notes

- Never commit secrets.
- If README references become stale due to a change, update them alongside your change.

# Ways of Working

## Code edit instructions

After you've finished editing

- Use the jetbrains mcp (if available) to find any problems
- Run format command if available
- Run lint command if available

## How to find problems

- DO THIS FIRST: Check the jetbrains provided MCP server (one of intellij, pycharm, webstorm) using get_file_problems
  - Only provide a file path if you know where the problem is, but not what the problem is. If you don't know where the
    problem is:
    - Inspect code changes with git
    - Run tests
- Run tests
- Run lint
- Inspect changed files

## How to run tests / lint / format

Use the following priority for running these commands:

1. Use a run configuration if present
2. Run a makefile target (via `make <command>` instead of the content of the target)
3. Run the command specified in the README.
