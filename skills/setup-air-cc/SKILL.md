---
name: setup-air-cc
description: air-claudecode setup wizard -- prerequisites check & install, plugin verification, CLAUDE.md block management, status report
model: sonnet
argument-hint: "[--check] [--force] [--update] [--help]"
---

# air-claudecode Setup

This is the **only command you need to learn**. After running this, everything else is automatic.

## Pre-flight Checks (always runs first)

**CRITICAL**: Before doing anything else, run these commands **immediately and unconditionally** at the start of every setup invocation. No questions asked -- just collect environment status.

**Run all of these in parallel:**

```bash
# brew installation check
which brew && echo "BREW_INSTALLED=true" || echo "BREW_INSTALLED=false"

# gh CLI installation check
which gh && echo "GH_INSTALLED=true" || echo "GH_INSTALLED=false"

# gh CLI authentication check
gh auth status 2>&1

# git-flow-next installation check
git flow version 2>&1 && echo "GITFLOW_INSTALLED=true" || echo "GITFLOW_INSTALLED=false"

# gogcli installation check
which gog && echo "GOG_INSTALLED=true" || echo "GOG_INSTALLED=false"
```
```
# Atlassian MCP availability check
ToolSearch("+atlassian jira")

# Slack MCP availability check
ToolSearch("+slack")
```

Collect results into a status map. Do not display output yet -- it will be shown in the Status Report step.

### Status Classification

**brew** (required for: installing other CLI tools):

| Result | Status | Fix |
|--------|--------|-----|
| `which brew` succeeds | `OK` | Show version |
| `which brew` fails | `MISS` | Show manual install: `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` |

**gh CLI** (required for: git-pr-master, git-issue-master, git-commit, git-branch):

| Result | Status | Fix |
|--------|--------|-----|
| Installed + authenticated | `OK` | Show username |
| Installed + not authenticated | `AUTH` | `gh auth login` |
| Not installed | `MISS` | Guide from `docs/install-guide/gh-installation-guide.md` |

**git-flow-next** (required for: git-flow-master):

| Result | Status | Fix |
|--------|--------|-----|
| `git flow version` succeeds | `OK` | Show version |
| `git flow version` fails | `MISS` | Guide from `docs/install-guide/git-flow-installation-guide.md` |

**Atlassian MCP** (required for: jira-master, confluence-master):

| Result | Status | Fix |
|--------|--------|-----|
| ToolSearch returns tools | `OK` | Show connected instance |
| ToolSearch returns nothing | `MISS` | Guide from `docs/install-guide/mcp-atlassian-installation-guide.md` |

**gogcli** (required for: gog-calendar):

| Result | Status | Fix |
|--------|--------|-----|
| `which gog` succeeds | `OK` | Show version if available |
| `which gog` fails | `MISS` | Guide from `docs/install-guide/gogcli-installation-guide.md` |

**Slack MCP** (optional -- enables Slack integration):

| Result | Status | Fix |
|--------|--------|-----|
| ToolSearch returns slack tools | `OK` | Show connected status |
| ToolSearch returns nothing | `MISS` | Guide from `docs/install-guide/slack-mcp-installation-guide.md` |

---

## Pre-Setup Check: Already Configured?

After pre-flight checks complete, detect if the plugin is already installed and working.

Check:
1. `.claude-plugin/plugin.json` exists and has `name` and `version`
2. `skills/` directory is populated
3. `agents/` directory is populated
4. `hooks/hooks.json` exists

### If Already Configured (and no --force flag)

If all plugin components are present AND no `--force` flag:

Use `AskUserQuestion` to prompt:

**Question:** "air-claudecode is already installed and working (v{version}). What would you like to do?"

**Options:**
1. **Quick health check** - Show pre-flight results and plugin status, then exit
2. **Run full setup** - Go through the complete setup wizard
3. **Cancel** - Exit without changes

**If user chooses "Quick health check":**
- Show the Status Report (pre-flight + plugin integrity)
- Exit

**If user chooses "Run full setup":**
- Continue with Step 1 below

**If user chooses "Cancel":**
- Exit without any changes

### Force Flag Override

If user passes `--force` flag, skip this check and proceed directly to Step 1.

---

## Usage Modes

This skill handles four scenarios:

| Flag | Behavior |
|------|----------|
| _(none)_ | Full interactive setup wizard with pre-setup detection |
| `--check` | Quick health check -- run pre-flight + plugin integrity, report and exit |
| `--force` | Force full setup wizard, skip pre-setup detection |
| `--update` | Update CLAUDE.md block only -- create or verify the marker block |
| `--help` | Show help text and exit |

### Mode Detection

- If `--check` flag present -> Run Pre-flight + Status Report, then **STOP**
- If `--force` flag present -> Skip Pre-Setup Check, run Step 1 directly
- If `--update` flag present -> Skip to Step 3 (CLAUDE.md Block Management) only, then **STOP**
- If `--help` flag present -> Show Help Text, then **STOP**
- If no flags -> Run Pre-Setup Check, then Step 1 if needed

---

## Step 1: Prerequisites Installation

After pre-flight checks, if any prerequisites have `MISS` or `AUTH` status:

### 1-1. Show all missing items

Present a summary of what's missing:

```
Prerequisites Check Result:
  ✓ brew          OK    Homebrew 4.x
  ✓ gh CLI        OK    authenticated as @username
  ✗ git-flow-next MISS  not installed
  ✓ Atlassian MCP OK    connected
  ✗ gogcli        MISS  not installed
  ✗ Slack MCP     MISS  not configured
```

### 1-2. Multi-select installation

Use `AskUserQuestion` with `multiSelect: true`:

```
AskUserQuestion:
  header: "Install"
  question: "설치되지 않은 항목이 있습니다. 설치할 항목을 선택하세요."
  multiSelect: true
  options:
    - label: "git-flow-next"
      description: "Git Flow 스킬에 필요 (brew install gittower/tap/git-flow-next)"
    - label: "gogcli"
      description: "Google Calendar 스킬에 필요"
    - label: "Slack MCP"
      description: "Slack 연동에 필요"
```

Only show items that are actually missing. Do not show items that are already OK.

### 1-3. Install selected items

For each selected item, read the corresponding installation guide from `docs/install-guide/` and follow the steps:

| Tool | Guide |
|------|-------|
| brew | Inline: `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` |
| gh CLI | `docs/install-guide/gh-installation-guide.md` |
| git-flow-next | `docs/install-guide/git-flow-installation-guide.md` |
| gogcli | `docs/install-guide/gogcli-installation-guide.md` |
| Atlassian MCP | `docs/install-guide/mcp-atlassian-installation-guide.md` |
| Slack MCP | `docs/install-guide/slack-mcp-installation-guide.md` |

**Important**: For MCP servers (Atlassian, Slack), installation involves configuring `~/.claude.json`. Ask the user for required credentials (URL, API token, etc.) via `AskUserQuestion` before writing config.

### 1-4. Verify installation

After installing selected items, re-run the pre-flight checks for those items only and confirm they now pass.

If any fail after installation, show the error and suggest manual troubleshooting.

---

## Step 2: Plugin Integrity Check

Verify the plugin structure is complete. Check each component and report status.

**Check these paths relative to the plugin root:**

| Component | Path | Check |
|-----------|------|-------|
| Plugin config | `.claude-plugin/plugin.json` | File exists, valid JSON, has `name` and `version` |
| Skills directory | `skills/` | Directory exists, count SKILL.md files |
| Agents directory | `agents/` | Directory exists, count `.md` files |
| Hooks config | `hooks/hooks.json` | File exists, has `SessionStart` and `UserPromptSubmit` entries |
| Hook scripts | `scripts/session-start.mjs` | File exists |
| Hook scripts | `scripts/keyword-detector.mjs` | File exists |

**Stop here if plugin config is missing.** Show reinstallation instructions and do not proceed to further steps.

---

## Step 3: CLAUDE.md Block Management

Manage the `<\!--air-claudecode:start-->` / `<\!--air-claudecode:end-->` block in the user's global CLAUDE.md (`~/.claude/CLAUDE.md`).

This step only creates/maintains the marker block. The block is a minimal placeholder -- users can add custom content between the markers later.

### 3-1. Read current CLAUDE.md

```bash
cat ~/.claude/CLAUDE.md 2>/dev/null || echo "FILE_NOT_EXISTS"
```

### 3-2. Check for existing block

Search for `<\!--air-claudecode:start-->` and `<\!--air-claudecode:end-->` markers.

### 3-3. Generate block content

Read the plugin version:

```bash
cat .claude-plugin/plugin.json | jq -r '.version'
```

**Block template:**

```markdown
<\!--air-claudecode:start-->
<\!-- air-claudecode v{version} — auto-generated, do not edit manually -->
<\!-- To update: /air-claudecode:setup-air-cc --update -->
<\!--air-claudecode:end-->
```

The block is intentionally minimal. Users can add custom instructions between the markers as needed.

### 3-4. Write block to CLAUDE.md

- **File doesn't exist**: Create `~/.claude/CLAUDE.md` with just the block
- **Block doesn't exist**: Append the block at the end of the file
- **Block exists**: Do not overwrite -- leave existing content between markers intact
- **Never modify content outside the markers**

Use the `Edit` tool (with `old_string` matching the existing block) or `Write` tool (for new file) as appropriate.

---

## Step 4: Status Report

Combine Pre-flight results, Plugin Integrity, and CLAUDE.md block status into a single consolidated report.

Use `AskUserQuestion` with `markdown` preview to display the report.

Version is read from `.claude-plugin/plugin.json` (`version` field). Skill and agent counts are detected by counting files at runtime.

```
air-claudecode Setup Report (v{version})
======================================

Plugin Integrity
  Plugin config    OK   .claude-plugin/plugin.json
  Skills           OK   {skill_count} skills found
  Agents           OK   {agent_count} agents found
  Hooks config     OK   SessionStart, UserPromptSubmit
  Hook scripts     OK   session-start.mjs, keyword-detector.mjs

Prerequisites
  brew             OK   Homebrew {version}
  gh CLI           OK   authenticated as @{username}
  git-flow-next    OK   installed ({version})
  Atlassian MCP    OK   connected to {instance}
  Slack MCP        OK   connected
  gogcli           OK   installed

CLAUDE.md
  Block            OK   ~/.claude/CLAUDE.md (updated)
```

With issues:
```
Prerequisites
  brew             OK   Homebrew 4.x
  gh CLI           OK   authenticated as @username
  git-flow-next    MISS not installed — skipped by user
  Atlassian MCP    MISS not configured — skipped by user
  Slack MCP        MISS not configured — skipped by user
  gogcli           MISS not installed — skipped by user
```

**If `--check` mode:** Stop here and exit.

---

## Step 5: Next Action

Use `AskUserQuestion` to offer next steps based on results.

**If all prerequisites are OK:**
- **Done** -- setup complete, ready to use
- **Test a skill** -- try a quick skill invocation to verify

**If some prerequisites were skipped:**
- **Done** -- setup complete (some features limited)
- **Install remaining** -- re-run prerequisite installation for skipped items

Only show fix options for prerequisites that are actually missing.

---

## Help Text

When user runs `/air-claudecode:setup-air-cc --help`, display:

```
air-claudecode Setup - Install, configure, and verify air-claudecode

USAGE:
  /air-claudecode:setup-air-cc            Run setup wizard (or health check if already configured)
  /air-claudecode:setup-air-cc --check    Quick health check (pre-flight + plugin integrity only)
  /air-claudecode:setup-air-cc --force    Force full setup wizard, skip pre-setup detection
  /air-claudecode:setup-air-cc --update   Update CLAUDE.md block only (create/verify markers)
  /air-claudecode:setup-air-cc --help     Show this help

WHAT IT CHECKS:
  Plugin Integrity
    - .claude-plugin/plugin.json    Plugin configuration
    - skills/                       Skill definitions (SKILL.md files)
    - agents/                       Agent definitions (.md files)
    - hooks/hooks.json              Hook configuration
    - scripts/                      Hook scripts (session-start, keyword-detector)

  Prerequisites
    - brew                          Homebrew package manager
    - gh CLI                        GitHub CLI (required for PR, issue, commit, branch skills)
    - git-flow-next                 Git Flow CLI (required for git-flow-master skill)
    - Atlassian MCP                 Atlassian MCP server (required for Jira, Confluence skills)
    - gogcli                        Google Calendar CLI (required for calendar skill)
    - Slack MCP                     Slack MCP server (optional, for Slack skill)

  CLAUDE.md
    - ~/.claude/CLAUDE.md           Managed marker block for custom instructions

EXAMPLES:
  /air-claudecode:setup-air-cc             # First time setup or re-check
  /air-claudecode:setup-air-cc --check     # Quick status check
  /air-claudecode:setup-air-cc --force     # Re-run full wizard
  /air-claudecode:setup-air-cc --update    # Create/verify CLAUDE.md marker block
```

---

## Output Style Rules

- Use consistent column alignment in status tables
- Status labels: `OK`, `MISS`, `FAIL`, `AUTH` (fixed width)
- Show version number in report header
- Keep lines under 80 characters where possible
- Use Korean in conversational text if the user is speaking Korean
- Use `markdown` preview field on AskUserQuestion options for status reports

---

## Final Checklist

- [ ] Pre-flight checks executed first (brew, gh CLI, git-flow-next, Atlassian MCP, Slack MCP, gogcli -- unconditionally, in parallel)
- [ ] Pre-setup detection: skip full wizard if already configured (unless --force)
- [ ] Missing prerequisites shown as multi-select list for batch installation
- [ ] Selected items installed following `docs/install-guide/` guides
- [ ] Installation verified after completion
- [ ] Plugin integrity verified (plugin.json, skills/, agents/, hooks/, scripts/)
- [ ] CLAUDE.md marker block created if not present
- [ ] Combined status report displayed
- [ ] Actionable next steps offered based on actual prerequisite status
- [ ] `--check` mode exits after status report
- [ ] `--force` mode skips pre-setup detection
- [ ] `--update` mode refreshes CLAUDE.md block only
- [ ] `--help` mode shows help text and exits
