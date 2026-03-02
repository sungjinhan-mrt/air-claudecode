# Display Templates

Templates for rendering todo data to users via `AskUserQuestion` with `markdown` preview.

All templates use monospace-friendly formatting for consistent rendering in the preview panel.

---

## Today View

Used by: `/todo`, `/todo today`

```
{DayName} {MM-DD} — Week {XX}
══════════════════════════════

{if carried items exist}
↳ {N} items carried from {PrevDayName}
{/if}

▌ P0 — Urgent
  ✓ Completed task text
  ▶ In progress task @assignee
    ✓ Done subtask
    ○ Pending subtask
  ! Blocked task -- blocked: reason
  ○ Pending task %topic #tag ~2d

▌ P1 — Important
  ○ Task description %topic #tag <- Thu
    ○ Subtask 1
    ○ Subtask 2

▌ P2 — Nice to Have
  (empty)

─────────────────────────────
✓ {done}/{total} completed today
```

### Symbol Mapping

| File Marker | Display Symbol | Meaning |
|-------------|----------------|---------|
| `[x]` | `✓` | Completed |
| `[>]` | `▶` | In progress |
| `[!]` | `!` | Blocked |
| `[ ]` | `○` | Pending |

### Rendering Rules

- Priority sections always shown, even if empty (display `(empty)`)
- Subtasks indented with 2 additional spaces
- Progress notes (`>` lines) omitted in today view for brevity
- Carry marker `<- DayName` shown inline
- Blocker reason shown inline after `--`
- Metadata tokens shown as-is: `%topic`, `#tag`, `@name`, `~duration`

---

## Week View

Used by: `/todo week`

```
Week {XX} (Sun {MM-DD} ~ Sat {MM-DD})
══════════════════════════════════════

Day        P0         P1         P2         Total
─────────  ─────────  ─────────  ─────────  ─────────
Sun {DD}   ✓2         ✓1 ○1      ○1         ✓3 ○2
Mon {DD}   ✓1 ▶1      ✓2 !1      ○2         ✓3 ▶1 !1 ○2
Tue {DD}   ○1         ▶2         -          ▶2 ○1
Wed {DD}   -          ○3         -          ○3        ← today
Thu {DD}   -          -          -          (empty)
Fri {DD}   -          -          -          (empty)
Sat {DD}   -          -          -          (empty)
─────────  ─────────  ─────────  ─────────  ─────────
Total      ✓3 ▶1 ○1  ✓3 ▶2 !1 ○4  ○3       ✓6 ▶3 !1 ○8

Overall: ████████░░░░░░░░ {pct}% ({done}/{total})
```

### Column Rules

- Each cell shows count by status: `✓N ▶N !N ○N` (omit zero counts)
- `-` for completely empty sections
- `← today` marker on current day row
- Footer row sums all days
- Overall progress bar at bottom

---

## Progress View

Used by: `/todo progress`

```
Week {XX} Progress (Sun {MM-DD} ~ Sat {MM-DD})
═══════════════════════════════════════════════

Overall: ████████░░░░░░░░ {pct}% ({done}/{total})

  ✓ Completed    {n}  {bar}
  ▶ In Progress  {n}  {bar}
  ! Blocked      {n}  {bar}
  ○ Pending      {n}  {bar}

By Priority:
  P0: {bar} {pct}% ({done}/{total})
  P1: {bar} {pct}% ({done}/{total})
  P2: {bar} {pct}% ({done}/{total})

By Day:
  Sun  {bar} {pct}% ({done}/{total})
  Mon  {bar} {pct}% ({done}/{total})
  Tue  {bar} {pct}% ({done}/{total})
  Wed  {bar} {pct}% ({done}/{total})  ← today
  Thu  {bar} {pct}% ({done}/{total})
  Fri  {bar} {pct}% ({done}/{total})
  Sat  {bar} {pct}% ({done}/{total})

{if blocked items exist}
Blocked Items:
  ! {task text} -- {reason}
  ! {task text} -- {reason}
{/if}
```

### Progress Bar Rendering

Use 16-character bars with block characters:

```
100%  ████████████████
 75%  ████████████░░░░
 50%  ████████░░░░░░░░
 25%  ████░░░░░░░░░░░░
  0%  ░░░░░░░░░░░░░░░░
```

Characters: `█` (filled), `░` (empty)

### Counting Rules

- Count **top-level tasks only** (not subtasks) for overall/priority/day metrics
- A task counts in the day where it currently appears
- Carried tasks count in their destination day (today), not origin

---

## Topic View

Used by: `/todo topic [name]`

### Topic List (no name given)

```
Topics
══════

Active:
  • my-project — Backend API 리뉴얼 프로젝트
    This week: ✓3 ▶2 ○5 (10 tasks)
    Backlog: 4 items

  • other-topic — Description
    This week: ✓1 ○2 (3 tasks)
    Backlog: 0 items

Archived:
  (none)
```

### Topic Detail (name given)

```
Topic: %{name}
══════════════

This Week (W{XX}):
  {DayName} {DD}:
    ✓ Completed task
    ▶ In progress task
      ○ Subtask 1
      ○ Subtask 2
  {DayName} {DD}:
    ○ Pending task

Backlog:
  ○ Future task
    ○ Subtask

─────────────────
Total: {done}/{total} completed ({pct}%)
```

---

## Backlog View

Used by: `/todo backlog`

```
Backlog
═══════

▌ P1 — Important
  ○ Task description %topic #tag {due date}
    ○ Subtask 1
    ○ Subtask 2

▌ P2 — Lower Priority
  ○ Another task

▌ Ideas
  ○ Someday item

─────────────────
{total} items in backlog
```

---

## Add Confirmation

Used by: `/todo add`

```
Task Added
══════════

{DayName} {MM-DD} / P{n}:
  ○ {task text} {%topic} {#tag} {@assignee} {~duration}
    ○ Subtask 1
    ○ Subtask 2
```

---

## Done Confirmation

Used by: `/todo done`

```
Task Completed
══════════════

{DayName} {MM-DD} / P{n}:
  ✓ {task text}
    ✓ Subtask 1 (was ○)
    ✓ Subtask 2 (was ▶)
```

---

## General Rendering Rules

1. **Double-line headers** (`═══`) for main titles
2. **Single-line separators** (`───`) for section dividers
3. **Vertical bar** (`▌`) for priority section markers
4. **Consistent indentation**: 2 spaces per nesting level
5. **Status symbols** always use the symbol mapping (not raw `[x]` markers)
6. **Empty sections** show `(empty)` rather than being hidden
7. **Today marker** (`← today`) on relevant day in weekly/progress views
8. **Metadata inline**: `%topic`, `#tag`, `@name`, `~duration` shown as-is from the source
