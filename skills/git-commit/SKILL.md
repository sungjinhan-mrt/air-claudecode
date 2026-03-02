---
name: git-commit
description: Create conventional commit messages with Jira/GitHub issue linking and user confirmation
model: sonnet
argument-hint: "[--auto] [message context]"
---

# Git Commit

Generate a commit message following the Conventional Commits specification. Auto-detects linked Jira tickets and GitHub issues. Shows changed files and the drafted message for user confirmation before committing.

## Use When
- User says "commit", "커밋", "commit this", "커밋 해줘"
- User has staged or unstaged changes to commit
- User wants a well-formatted conventional commit message

## Do Not Use When
- User wants to create a PR -- use git-pr-master instead
- User wants to amend or rebase -- use git commands directly
- Nothing has changed in the working tree

## Modes

### Default Mode
Shows changed files and drafted message, asks for user confirmation via `AskUserQuestion` before committing.

### Auto Mode
When user says "auto commit", "자동 커밋", or argument contains `--auto`:
- Skip user confirmation (no `AskUserQuestion`)
- Stage all changed files, draft message, and commit directly
- Show commit hash and summary after completion

## Steps

1. **Check changes**
   - Run `git status` to see staged and unstaged files
   - Run `git diff --cached --stat` for staged file summary
   - If nothing staged -- run `git diff --stat` and ask user to stage files first
   - Run `git log --oneline -5` to match existing commit style

2. **Detect references**
   - **Jira ticket**: extract from branch name (`git branch --show-current`)
     - Pattern: `feature/PROJ-123-desc`, `bugfix/PROJ-456-desc`, `PROJ-789`
   - **GitHub issue**: extract from branch name or user context
     - Pattern: `feature/42-add-login`, `issue-42`, `fix-#42`

3. **Analyze changes**
   - Run `git diff --cached` (or `git diff` if nothing staged) to understand the actual changes
   - Determine the nature: new feature, bug fix, refactor, docs, test, chore, etc.
   - Identify the scope (module/component affected)

4. **Draft commit message** following [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):

   ```
   <type>(<scope>): <subject>

   <body>

   <footer>
   ```

   **type**: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`, `build`, `style`
   **scope**: module or component affected (optional but encouraged)
   **subject**: imperative mood, lowercase, no period, max 50 chars
   **body**: explain WHY not WHAT, wrap at 72 chars
   **footer**:
   - Jira: `Refs: PROJ-123` or `Closes: PROJ-123`
   - GitHub: `Closes #42` or `Refs #42`
   - Breaking: `BREAKING CHANGE: description`
   - AI ratio: `AI-authored: N%` (integer, no decimals) — estimate percentage of code in this commit written by AI. 0% = fully human, 100% = fully AI-generated

5. **Show and confirm** (skip in Auto Mode -- go directly to step 6)

   Present to user via `AskUserQuestion`.
   Use the `markdown` preview field on the **Commit** option to show the full commit preview (branch, changed files, commit message). This renders a monospace preview panel for easy review.

   ```
   Branch: feature/PROJ-456-jwt-refresh

   Changed files:
     M  src/auth/login.ts
     A  src/auth/token.ts
     D  src/auth/legacy.ts

   Commit message:
   ─────────────────
   feat(auth): add JWT refresh token rotation

   Implement automatic token refresh to prevent session expiration
   during active usage. Refresh tokens are rotated on each use
   to limit replay window.

   Refs: PROJ-456
   Closes #42
   AI-authored: 85%
   ─────────────────
   ```

   Options:
   - **Commit** -- proceed with this message
   - **Edit** -- modify the message
   - **Cancel** -- abort

6. **Commit**
   - Default Mode: only after user selects "Commit"
   - Auto Mode: commit immediately after drafting
   - Stage files if needed: `git add <specific files>`
   - Commit: `git commit -m "<message>"`
   - Show result: commit hash and summary

## Examples

**Good:**
Branch: `feature/PROJ-456-jwt-refresh`
Staged: new token rotation logic in auth/
```
feat(auth): add JWT refresh token rotation

Implement automatic token refresh to prevent session
expiration during active usage.

Refs: PROJ-456
AI-authored: 90%
```
Why good: Correct type, scope from directory, Jira auto-linked from branch, body explains why, AI ratio included.

**Bad:**
Branch: `feature/PROJ-456-jwt-refresh`
Staged: mixed auth + config changes
Message: `update files`
Why bad: No type, no scope, no description, missed Jira reference, didn't suggest splitting.

## Final Checklist
- [ ] Changes analyzed -- not just filenames, actual diff read
- [ ] Commit type matches the nature of changes
- [ ] Subject is imperative mood, lowercase, under 50 chars, no period
- [ ] Jira ticket linked in footer if detected from branch
- [ ] GitHub issue linked in footer if detected
- [ ] Changed files and full message shown to user before commit (Default Mode)
- [ ] User explicitly confirmed via AskUserQuestion (Default Mode) or Auto Mode detected
- [ ] AI-authored percentage included in footer (integer, no decimals)
- [ ] Multiple concerns flagged for splitting if detected
