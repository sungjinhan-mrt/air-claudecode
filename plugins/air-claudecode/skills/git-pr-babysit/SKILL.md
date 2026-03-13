---
name: git-pr-babysit
description: Monitor open PRs across air-* repos and auto-review new/updated ones. Use with /loop for continuous monitoring.
disable-model-invocation: true
context: fork
agent: general-purpose
allowed-tools: Bash, Read, Write, Glob, Grep
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

Path: `~/.claude/pr-reviews/state.json`

Load current state:
!`mkdir -p ~/.claude/pr-reviews/reviews && cat ~/.claude/pr-reviews/state.json 2>/dev/null || echo '{}'`

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

### Step 3: Review Each New/Updated PR

For each unreviewed PR:

1. Fetch the diff:
   ```bash
   gh pr diff <number> -R myrealtrip/<repo>
   ```

2. Fetch PR details (description, comments):
   ```bash
   gh pr view <number> -R myrealtrip/<repo>
   ```

3. Perform the review following the guidelines above. Output in Korean.

4. Save the review to a markdown file:
   - Path: `~/.claude/pr-reviews/reviews/<repo>_PR<number>_<commit_hash>.md`
   - Format:

   ```markdown
   # PR Review: <repo> #<number>

   - **Title**: <pr title>
   - **Author**: <author>
   - **Branch**: <branch name>
   - **Reviewed Commit**: <commit hash>
   - **Review Date**: <current date>
   - **Status**: [Approved | Request Changes | Comment Only]

   ---

   ## Overview
   [1-3 sentences summarizing the PR and quality assessment in Korean]

   ---

   ## Issues Found

   ### Critical (P0)
   | File | Line | Issue | Recommendation |
   |------|------|-------|----------------|

   ### Major (P1)
   | File | Line | Issue | Recommendation |
   |------|------|-------|----------------|

   ### Minor (P2)
   | File | Line | Issue | Recommendation |
   |------|------|-------|----------------|

   ### NIT
   - ...

   ---

   ## Highlights
   - [Good practices observed]

   ---

   ## Summary
   | Category | Count |
   |----------|-------|
   | Files Changed | ## |
   | Critical Issues | ## |
   | Major Issues | ## |
   | Minor Issues | ## |
   ```

5. Update the state file (`~/.claude/pr-reviews/state.json`):
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
           "review_file": "<repo>_PR<number>_<commit_hash>.md",
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
Reviews saved to: ~/.claude/pr-reviews/reviews/
```

## Important Rules

- NEVER post review comments directly to GitHub — only save locally
- NEVER approve or merge PRs — this is read-only monitoring
- Be pragmatic — don't over-engineer simple changes, focus on real issues
- Keep reviews concise — max 15 issues per PR unless critical issues require more
- If `gh` CLI fails for a repo (permissions, not found), log the error and continue with other repos
- If a PR diff is too large (>3000 lines), note this and review only the most critical files
