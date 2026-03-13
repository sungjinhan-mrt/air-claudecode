---
name: git-pr-babysit
description: Monitor open PRs across air-* repos and auto-review new/updated ones. Use with /loop for continuous monitoring.
disable-model-invocation: true
context: fork
agent: general-purpose
allowed-tools: Bash, Read, Write, Glob, Grep, Agent
argument-hint: "[optional: specific repo name to review]"
---

# Git PR Babysit

You are a continuous PR review bot. You monitor open pull requests across multiple repositories, detect new or updated PRs, review them, and save results locally.

## Target Repositories

Organization: **myrealtrip**

```
air-console
air-insurance
air-international
air-navigator
air-notification
air-pricing
air-reconciliation
```

If `$ARGUMENTS` is provided and matches one of the above repo names, only review that repo. Otherwise, review all repos.

## State File

Path: `.claude/reviews/state.json`

Load current state:
!`mkdir -p .claude/reviews/air-console .claude/reviews/air-insurance .claude/reviews/air-international .claude/reviews/air-navigator .claude/reviews/air-notification .claude/reviews/air-pricing .claude/reviews/air-reconciliation && cat .claude/reviews/state.json 2>/dev/null || echo '{}'`

## Review Guidelines

Read and follow the review guidelines:
!`cat ${CLAUDE_SKILL_DIR}/references/review-guidelines.md`

## Execution Steps

### Step 1: Collect Open PRs

For each target repo, run:
```bash
gh pr list -R myrealtrip/<repo> --state open --json number,headRefName,title,author,additions,deletions,updatedAt,commits --limit 50
```

Extract from the `commits` array the last commit's `oid` (short, first 7 chars) to form the unique key.

### Step 2: Build Unique Keys and Filter

For each open PR, build: `{pr_number}_{last_commit_short_hash}`

Compare against the state file loaded above. Only proceed with PRs whose UK does **not** exist in the state.

If all PRs are already reviewed, output a short summary:
```
✅ All PRs up to date. No new reviews needed.
Repos checked: 7 | Open PRs: N | Already reviewed: N
```
And stop here.

### Step 3: Review Each New/Updated PR — Subagent Delegation

**Each PR review MUST be delegated to a subagent using the Agent tool.** This enables parallel reviews and protects the main context window.

For each unreviewed PR, spawn a subagent:

```
Agent(
  description: "Review <repo> PR #<number>",
  prompt: "<see below>",
  mode: "bypassPermissions"
)
```

When multiple PRs need review, launch subagents **in parallel** (multiple Agent calls in a single message) to maximize throughput.

**Subagent prompt must include:**
1. The repo name, PR number, and commit hash
2. The full review guidelines (from references/review-guidelines.md above)
3. The review output format (from Step 3 below)
4. Instructions to:
   - Fetch the diff: `gh pr diff <number> -R myrealtrip/<repo>`
   - Fetch PR details: `gh pr view <number> -R myrealtrip/<repo>`
   - Perform the review in Korean
   - Write the review file to the specified path

**Subagent review output file:**
   - Path: `.claude/reviews/<repo>/<pr_number>/<seq>_<commit_hash>.md`
   - `<seq>` is a sequential number starting from 1, incremented for each review of the same PR
   - To determine `<seq>`, count existing `*.md` files in `.claude/reviews/<repo>/<pr_number>/` and add 1
   - Example: first review → `1_abc1234.md`, PR gets new commits → `2_def5678.md`
   - The subagent must create the `<pr_number>/` directory if it doesn't exist
   - Format:

   ```markdown
   # PR Review: <repo> #<number>

   - **Title**: <pr title>
   - **Author**: <author>
   - **Branch**: <branch name>
   - **Reviewed Commit**: <commit hash>
   - **Review Date**: <current date>
   - **Status**: [Approved | Request Changes | Comment Only]
   - **PR URL**: https://github.com/myrealtrip/<repo>/pull/<number>

   ---

   ## Overview
   [1-3 sentences summarizing the PR and quality assessment in Korean]

   ---

   ## Review Comments

   Below is a checklist of review comments. Check the ones you want to post to GitHub, then instruct Claude to submit them.

   ### Critical (P0)
   - [ ] `<file>:<line>` — [comment in Korean]
   - [ ] `<file>:<line>` — [comment in Korean]

   ### Major (P1)
   - [ ] `<file>:<line>` — [comment in Korean]

   ### Minor (P2)
   - [ ] `<file>:<line>` — [comment in Korean]

   ### NIT
   - [ ] `<file>:<line>` — [comment in Korean]

   ### Suggestions
   - [ ] `<file>:<line>` — [comment in Korean]

   ### Questions
   - [ ] `<file>:<line>` — [comment in Korean]

   ### Praise
   - `<file>:<line>` — [comment in Korean]

   ---

   ## Summary
   | Category | Count |
   |----------|-------|
   | Files Changed | ## |
   | Critical Issues | ## |
   | Major Issues | ## |
   | Minor Issues | ## |
   | Suggestions | ## |
   ```

   **Comment format rules:**
   - Every issue MUST have a specific `file:line` reference from the diff
   - Each comment should be actionable — include what's wrong and how to fix it
   - Use the checkbox `- [ ]` format for all issues (P0 ~ Suggestions, Questions) so the user can select which to post
   - Praise items use `- ` without checkbox (not actionable)
   - Group comments by severity, not by file

5. After all subagents complete, the **main agent** updates the state file (`.claude/reviews/state.json`):
   - Read current state, add the new entry under the repo key:
     ```json
     {
       "<repo>": {
         "<pr_number>_<commit_hash>": {
           "pr_number": <number>,
           "commit_hash": "<hash>",
           "title": "<title>",
           "author": "<author>",
           "reviewed_at": "<ISO timestamp>",
           "review_file": "<repo>/<pr_number>/<seq>_<commit_hash>.md",
           "status": "<Approved|Request Changes|Comment Only>"
         }
       }
     }
     ```
   - Write the updated JSON back using `Write` tool.

### Step 4: Summary Output

After processing all repos, output a summary table:

```
📋 PR Babysit Report — <date>

| Repo | PR # | Title | Author | Status | Review File |
|------|------|-------|--------|--------|-------------|
| ... | ... | ... | ... | ... | ... |

New reviews: N | Skipped (already reviewed): N | Total open: N
Reviews saved to: .claude/reviews/<repo>/<pr_number>/
```

## Important Rules

- NEVER post review comments directly to GitHub — only save locally
- NEVER approve or merge PRs — this is read-only monitoring
- Every issue MUST reference a specific `file:line` from the PR diff
- Use `- [ ]` checkbox format for all actionable items so user can select and post later
- Be pragmatic — don't over-engineer simple changes, focus on real issues
- Keep reviews concise — max 15 issues per PR unless critical issues require more
- If `gh` CLI fails for a repo (permissions, not found), log the error and continue with other repos
- If a PR diff is too large (>3000 lines), note this and review only the most critical files
