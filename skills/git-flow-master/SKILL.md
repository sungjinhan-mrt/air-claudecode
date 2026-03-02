---
name: git-flow-master
description: Git Flow lifecycle -- init, feature/release/hotfix/bugfix/support start/finish/publish/update/delete with Jira linking
context: fork
agent: git-flow-master
argument-hint: "[action] [type] [name]"
---

# Git Flow Master

Routes to the git-flow-master agent for Git Flow lifecycle operations using [git-flow-next](https://github.com/gittower/git-flow-next).

## Usage

```
/air-claudecode:git-flow-master <flow task>
```

### Examples

```
/air-claudecode:git-flow-master feature start PROJ-123-add-login
/air-claudecode:git-flow-master release start 1.2.0
/air-claudecode:git-flow-master hotfix start PROJ-456-fix-crash
/air-claudecode:git-flow-master finish
/air-claudecode:git-flow-master publish
/air-claudecode:git-flow-master overview
```

## Capabilities

- Full Git Flow lifecycle: init, start, finish, publish, update, delete, list
- Supports all branch types: feature, release, hotfix, bugfix, support
- Shorthand commands: `finish`, `publish`, `update` on current branch (auto-detects type)
- Pre-fetches context in a single Bash call (branch, status, flow config, active branches)
- Auto-detects Jira ticket from branch name and links via Atlassian MCP
- Pre-checks: uncommitted changes, remote sync, git-flow initialized
- Confirms every state-changing operation via AskUserQuestion
- Shows merge direction: `develop <-- feature/PROJ-123-desc`
- Suggests next steps: after start -> `git-commit`, after publish -> `git-pr-master`
- Version suggestion for releases: parses latest tag via `git tag --sort=-v:refname`

## Prerequisites

Install git-flow-next (modern Go reimplementation):

```bash
brew install gittower/tap/git-flow-next
```

## Integration

- After `feature start` -> use `/air-claudecode:git-commit` for commits
- After `publish` -> use `/air-claudecode:git-pr-master` to create a PR
- Branch naming follows `conventions/git-workflow.md`
