---
name: todo
description: Weekly markdown-based todo management with auto-carry, progress tracking, and topic search
model: sonnet
argument-hint: "[today|add|done|week|progress|topic|backlog|new-week|help] [args]"
---

Base directory for this skill: ${SKILL_DIR}

# Todo

Manage weekly todos in markdown files. Tasks are organized by ISO week (Sunday start), with daily sections, priority levels (P0/P1/P2), subtasks, and rich metadata.

## Use When
- User says "todo", "투두", "할일", "tasks"
- User wants to view, add, complete, or manage daily/weekly tasks
- User wants to check progress or search by topic

## Do Not Use When
- User wants project-level task management (use Jira instead)
- User wants to manage GitHub issues (use git-issue-master instead)

## Initialization

**Run on every invocation before any command:**

1. Read `~/.claude/CLAUDE.md` and find the `todo-workspace:` line
2. Extract the workspace path (e.g., `todo-workspace: /Users/me/Desktop/todo-workspace`)
3. If path not found:
   - Use `AskUserQuestion` to ask workspace location (default: `~/Desktop/todo-workspace`)
   - Create directory structure:
     ```
     {workspace}/
     ├── templates/weekly.md
     ├── backlog.md
     └── topics.md
     ```
   - Create `templates/weekly.md` from the template in `references/format-guide.md` (Weekly Template section)
   - Create `backlog.md` with initial structure: `# Backlog\n\n## P1\n\n## P2\n\n## Ideas\n`
   - Create `topics.md` with initial structure: `# Topics\n\n> Active projects and areas of work. Tasks use %topic-name to link here.\n\n## Active\n\n## Archived\n`
   - Write `todo-workspace` path inside the `<\!--air-claudecode:start-->` / `<\!--air-claudecode:end-->` block in `~/.claude/CLAUDE.md`:
     - Find the `<\!--air-claudecode:end-->` marker
     - Insert `todo-workspace: {path}` on a new line just before `<\!--air-claudecode:end-->`
     - If the air-claudecode block doesn't exist, append the full block:
       ```
       <\!--air-claudecode:start-->
       <\!-- air-claudecode — auto-generated, do not edit manually -->
       todo-workspace: {path}
       <\!--air-claudecode:end-->
       ```
   - **Never write outside the air-claudecode markers**
4. Verify workspace path exists on disk. If deleted, repeat step 3.

Store the resolved workspace path as `$WS` for use in all subsequent steps.

## Date Calculation

**CRITICAL**: All date calculations must use the system date. Use **bash `date`** only.

```bash
# Get all date info in a single call
date +"%Y %m %d %A %u"    # e.g., 2026 03 02 Monday 1
```

**ISO Week with Sunday start**: This system uses Sunday as the first day of the week.
- Week file name: `YYYY-WXX.md` where XX is the week number (Sunday-start)
- Use this bash one-liner to calculate (macOS `date`):

```bash
# Sunday-start week number: shift Sunday (+1 day) so it falls into the next ISO week
DOW=$(date +%u)  # 1=Mon..7=Sun
if [ "$DOW" -eq 7 ]; then
  # Today is Sunday — use tomorrow's ISO week
  WEEK_ID=$(date -v+1d +"%G-W%V")
else
  WEEK_ID=$(date +"%G-W%V")
fi
echo "$WEEK_ID"
```

```bash
# Get week start (Sunday) and end (Saturday) dates for display
if [ "$DOW" -eq 7 ]; then
  SUN_DATE=$(date +"%m-%d")
else
  SUN_DATE=$(date -v-${DOW}d +"%m-%d")   # go back to last Sunday
fi
# Saturday = Sunday + 6 days
SAT_DATE=$(date -j -f "%m-%d" "$SUN_DATE" -v+6d +"%m-%d" 2>/dev/null || date -v-${DOW}d -v+6d +"%m-%d")
```

```bash
# Get yesterday's day name (for auto-carry)
YESTERDAY_NAME=$(date -v-1d +"%a")   # e.g., "Sun", "Mon"
TODAY_NAME=$(date +"%a")
TODAY_DATE=$(date +"%m-%d")
```

Use `$WEEK_FILE` to refer to `$WS/$WEEK_ID.md`.

**Day name mapping for sections**: Sun, Mon, Tue, Wed, Thu, Fri, Sat

## Commands

Parse the first argument to determine the command. Default (no argument) = `today`.

---

### `/todo` or `/todo today` — View Today

1. **Resolve week file**: Calculate `$WEEK_FILE`. If it doesn't exist, create it from `$WS/templates/weekly.md` with correct dates filled in.

2. **Auto-carry**: Read the previous day's section (yesterday, or Friday→Monday for weekends crossing):
   - Find all top-level tasks with status `[ ]`, `[>]`, or `[!]`
   - For each, check if today's section already has this task (match by task text, ignoring status/carry markers)
   - If NOT already carried:
     - Copy the entire task block (task line + all subtasks + notes) to today's section under the same priority level
     - Append `<- {DayName}` after the task metadata on the carried line
     - Preserve all subtask states, metadata, and notes
     - **Do NOT modify the original** — keep history intact
   - If tasks were carried, note how many in the output

3. **Display**: Read today's section and show via `AskUserQuestion` with `markdown` preview.
   Use the Today View template from `references/display-templates.md`.

   Options:
   - **Add task** — switch to add flow
   - **Done** — exit

---

### `/todo add "task description"` — Add Task

1. **Parse arguments**: Extract from the argument string:
   - Task text (required)
   - `%topic-name` — topic link (optional)
   - `#tag` — category tag (optional)
   - `@assignee` — person (optional)
   - `~duration` — estimate (optional)
   - `P0`/`P1`/`P2` — priority (optional)
   - Subtasks can be provided as comma-separated list after `--sub` flag

2. **If priority not specified**: Use `AskUserQuestion` to ask:
   - P0 (urgent, must do today)
   - P1 (important, should do today) — default
   - P2 (nice to have)

3. **If subtasks provided via `--sub`**: Format each as indented `- [ ] subtask`

4. **Write**: Open `$WEEK_FILE`, find today's day section → priority subsection, append the task:
   ```
   - [ ] {task text} {@assignee} {%topic} {#tag} {~duration}
     - [ ] subtask 1
     - [ ] subtask 2
   ```

5. **Confirm**: Show the added task via `AskUserQuestion` markdown preview.

**Examples:**
```
# Full metadata — assignee, topic, tag, priority, estimate, subtasks
/todo add "API 설계" @alice %my-project #feat P0 ~2d --sub "endpoint 정의, schema 설계, 문서화"

# Partial metadata — priority will be asked interactively
/todo add "배포 스크립트 세팅" %my-project #ops

# Minimal — just a task name, defaults to P1
/todo add "코드 리뷰"
```

---

### `/todo done "task keyword"` — Complete Task

1. **Search**: Read today's section in `$WEEK_FILE`. Find tasks matching the keyword (case-insensitive substring match on the task text).

2. **If multiple matches**: Use `AskUserQuestion` to let user select which task.

3. **If task has subtasks**:
   - Show subtasks and their current status
   - Ask via `AskUserQuestion`: "Complete all subtasks too?" with options:
     - **All** — mark parent + all subtasks as `[x]`
     - **Parent only** — mark only the parent as `[x]`
     - **Select** — let user pick which subtasks to complete

4. **Update**: Change `[ ]` or `[>]` to `[x]` for selected items using the Edit tool.

5. **Show result**: Display the updated task.

---

### `/todo week` — Weekly Overview

1. **Read** `$WEEK_FILE` entirely.

2. **Build summary**: For each day (Sun–Sat), count tasks by status and show a compact overview.
   Use the Week View template from `references/display-templates.md`.

3. **Display** via `AskUserQuestion` with `markdown` preview.

   Options:
   - **View day** — ask which day, then show that day's details
   - **Done** — exit

---

### `/todo progress` — Progress Summary

1. **Read** `$WEEK_FILE`.

2. **Count** all task checkboxes (top-level only, not subtasks):
   - `[x]` = completed
   - `[>]` = in progress
   - `[!]` = blocked
   - `[ ]` = pending

3. **Calculate** percentages overall, by priority (P0/P1/P2), and by day.

4. **Render** progress bars using block characters. Use the Progress View template from `references/display-templates.md`.

5. **Display** via `AskUserQuestion` with `markdown` preview.

---

### `/todo topic [name]` — Topic Search

1. **No name given**: Read `$WS/topics.md` and display the Active topics list.

2. **Name given**: Search across `$WEEK_FILE` and `$WS/backlog.md` for tasks containing `%{name}`.
   - Collect all matching task blocks (with subtasks and notes)
   - Group by source (this week / backlog)
   - Use the Topic View template from `references/display-templates.md`

3. **Display** via `AskUserQuestion` with `markdown` preview.

   Options:
   - **Add topic** — add a new topic to `topics.md` (only shown when listing all topics)
   - **Done** — exit

---

### `/todo backlog` — Backlog Management

1. **Read** `$WS/backlog.md` and display contents.

2. **Options** via `AskUserQuestion`:
   - **Add to backlog** — prompt for task details, append to appropriate priority section
   - **Move to today** — select a backlog item to move to today's section (remove from backlog, add to today)
   - **Done** — exit

---

### `/todo new-week` — Create New Week File

1. **Calculate** the next week's dates (next Sunday through Saturday).

2. **Check** if file already exists. If yes, inform and exit.

3. **Generate** from `$WS/templates/weekly.md`:
   - Replace `YYYY-WXX` with actual week identifier
   - Replace `Sun MM-DD` through `Sat MM-DD` with actual dates

4. **Carry-over prompt**: Read current week's remaining incomplete tasks.
   - If any exist, use `AskUserQuestion`:
     - **Carry all** — copy all incomplete to the new week's first relevant day
     - **Select** — let user pick which to carry
     - **None** — start clean
   - Carried items get `<- W{XX}` marker

5. **Write** the new file and confirm.

---

### `/todo help` — Show Help

Display this command reference:

```
Todo — Weekly markdown todo manager

USAGE:
  /todo                     View today's todos (auto-carries incomplete from yesterday)
  /todo add "task" [opts]   Add a new task to today
  /todo done "keyword"      Mark a task as completed
  /todo week                View the entire week
  /todo progress            Show weekly progress summary
  /todo topic [name]        List topics or search tasks by topic
  /todo backlog             View and manage backlog
  /todo new-week            Create next week's file

TASK FORMAT:
  - [status] task text @assignee %topic #tag ~duration YYYY-MM-DD <- Day [links]

  Status:  [ ] pending   [x] completed   [>] in progress   [!] blocked
  Tokens:  @assignee  %topic  #tag  ~duration  P0/P1/P2  --sub "a, b"

EXAMPLE WORKFLOW:
  # Morning: check today's todos (auto-carries yesterday's incomplete items)
  /todo

  # Add a task with full metadata
  /todo add "API 설계" @alice %my-project #feat P0 ~2d --sub "endpoint 정의, schema 설계"

  # Add a quick task (will ask priority interactively)
  /todo add "코드 리뷰"

  # Complete a task by keyword match
  /todo done "API"

  # Check weekly progress with visual breakdown
  /todo progress

  # Search all tasks linked to a topic
  /todo topic my-project

  # Pull an item from backlog into today
  /todo backlog

  # Prepare next week's file (optionally carry incomplete items)
  /todo new-week
```

---

## Format Reference

Refer to `references/format-guide.md` for the full format specification including:
- Status markers and their meanings
- Metadata syntax (@, %, #, ~)
- Carry-over markers
- Progress notes format
- Subtask indentation rules
- Weekly file template

## Display Reference

Refer to `references/display-templates.md` for output rendering templates including:
- Today View layout
- Week View summary table
- Progress View with bars
- Topic View grouped display

## Final Checklist
- [ ] Workspace path resolved from `~/.claude/CLAUDE.md` (inside air-claudecode block)
- [ ] Correct week file identified/created with Sunday-start weeks
- [ ] Auto-carry executed for today view (incomplete items from yesterday)
- [ ] Tasks displayed using `AskUserQuestion` with `markdown` preview
- [ ] File edits use the `Edit` tool (not Bash sed/awk)
- [ ] Subtask hierarchy preserved in all operations
- [ ] Carry markers (`<- DayName`) added to migrated tasks
- [ ] Original tasks in previous day NOT modified (history preservation)
