---
name: git-branch
description: Create a git branch with conventional naming -- from Jira issue or manual description
model: sonnet
argument-hint: "[PROJ-123] [description]"
---

# Git Branch

Create a git branch with conventional naming. Fetches Jira ticket details when available, or generates from user description. Asks for confirmation before creating.

## Use When
- User says "create branch", "브랜치 만들어", "branch from ticket"
- User provides a Jira ticket ID (e.g., PROJ-123)
- User wants a conventionally-named branch with or without a Jira link

## Do Not Use When
- User wants to switch branches -- use `git checkout` directly
- User wants to delete or rename branches -- use git commands directly

## Steps

1. **Determine source**

   **With Jira ticket** (ticket ID provided or found in context):
   - Call `ToolSearch("+atlassian jira")` before first MCP use
   - Fetch with `mcp__mcp-atlassian__jira_get_issue`
   - Extract: ticket key, summary, issue type

   **Without Jira ticket** (no ticket ID):
   - Ask user for: branch purpose (feature, fix) and short description
   - Or infer from user's natural language description

2. **Generate branch name**

   Prefix rules:
   | Source | Prefix |
   |--------|--------|
   | Bug, Defect, or user says "fix"/"bugfix" | `fix/` |
   | Everything else | `feature/` |

   Format with Jira: `{prefix}{PROJ-123}-{kebab-summary}`
   Format without Jira: `{prefix}{kebab-summary}`
   - Summary: lowercase, spaces to hyphens, strip special characters
   - Max 3-4 words -- keep it short and recognizable
   - Total branch name should not exceed 35 chars

   Examples:
   - With Jira: `feature/PROJ-123-jwt-refresh-token`
   - Without Jira: `fix/login-timeout-mobile`

3. **Ask user** via `AskUserQuestion`

   Present:
   ```
   Jira: PROJ-123 - Add JWT refresh token rotation  (or "No Jira ticket")
   Type: Story

   Branch: feature/PROJ-123-jwt-refresh-token
   ```

   Questions:
   - **Base branch**: select from available branches (suggest `develop`, `main`)
   - **Branch name**: confirm or edit
   - Final: Create / Edit / Cancel

4. **Create branch** only after user confirms
   - `git fetch origin`
   - `git checkout -b {branch-name} --no-track origin/{base-branch}`
   - Show result: branch name and current status

## Examples

**Good (with Jira):**
User: "PROJ-456 브랜치 만들어"
Fetched: PROJ-456 "Fix login timeout on mobile Safari" (Bug)
Generated: `fix/PROJ-456-login-timeout-mobile`
Why good: Correct prefix for Bug, Jira linked, user confirmed.

**Good (without Jira):**
User: "유저 프로필 기능 브랜치 만들어줘"
Generated: `feature/user-profile-page`
Why good: No Jira needed, description extracted from user input, prefix correct.

**Bad:**
User: "브랜치 만들어"
Action: Create `feature/new-branch` without asking for description.
Why bad: Generic name, no context gathered, no user confirmation.

## Final Checklist
- [ ] Jira ticket fetched if ID was provided or detectable
- [ ] If no Jira -- description gathered from user input
- [ ] Branch prefix matches type (fix/ for bugs, feature/ for others)
- [ ] Summary is kebab-case, max 3-4 words, total branch name under 35 chars
- [ ] Base branch explicitly selected by user
- [ ] User confirmed branch name via AskUserQuestion
- [ ] Branch created from latest remote (`git fetch` before checkout)
