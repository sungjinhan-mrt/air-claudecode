# Todo Format Guide

This document defines the markdown format conventions for the todo workspace.

---

## File Structure

```
todo-workspace/
├── templates/
│   └── weekly.md           # Template for new weekly files
├── YYYY-WXX.md             # Weekly files (ISO week, Sunday start)
├── backlog.md              # Backlog items not yet scheduled
└── topics.md               # Topic/project index
```

---

## Weekly File Format

### File Naming

`YYYY-WXX.md` where:
- `YYYY` = year
- `WXX` = week number (Sunday-start, zero-padded)

Example: `2026-W10.md`

### Header

```markdown
# YYYY-WXX (Sun MM-DD ~ Sat MM-DD)
```

### Daily Sections

Each day has a level-2 heading with three priority subsections:

```markdown
## {DayName} MM-DD

### P0

### P1

### P2

---
```

Days appear in order: Sun, Mon, Tue, Wed, Thu, Fri, Sat.
A horizontal rule (`---`) separates each day.

---

## Status Markers

| Marker | Meaning | When to Use |
|--------|---------|-------------|
| `[ ]` | Pending | Task not yet started |
| `[x]` | Completed | Task finished |
| `[>]` | In Progress | Actively working on it |
| `[!]` | Blocked | Cannot proceed (add `-- blocked: reason`) |

---

## Task Line Format

```
- [status] {task text} {metadata...}
```

### Metadata Tokens (all optional, space-separated after task text)

| Token | Purpose | Example |
|-------|---------|---------|
| `%topic-name` | Link to topic/project | `%my-project` |
| `#tag` | Category label | `#ops`, `#feat`, `#bug`, `#incident` |
| `@name` | Assignee | `@alice`, `@bob` |
| `~duration` | Time estimate | `~2d`, `~4h`, `~30m` |
| `YYYY-MM-DD` | Due date or created date | `2026-02-27` |
| `[text](url)` | Reference link | `[slack](https://...)`, `[JIRA-123](https://...)` |
| `<- {DayName}` | Carried from previous day | `<- Thu` |
| `<- W{XX}` | Carried from previous week | `<- W09` |

### Order Convention

```
- [status] {task text} {@assignee} {%topic} {#tag} {~duration} {YYYY-MM-DD} {<- Day} {[links]}
```

---

## Subtasks

Indent with 2 spaces. Subtasks have their own status markers.

---

## Progress Notes

Timestamped notes indented under a task using `>` prefix. Appended chronologically (newest last).

---

## Blocker Syntax

Append `-- blocked: {reason}` after the task text or subtask text.

---

## Carry-Over Markers

When a task is migrated from a previous day or week, append `<- {DayName}` or `<- W{XX}` after metadata, before links.

---

## Comprehensive Example

A realistic daily section showing all format conventions together:

```markdown
## Thu 03-05

### P0
- [>] 서버 인프라 구성 @alice %my-project #ops 2026-03-05 [jira](https://jira.example.com/PROJ-101)
  - [!] DB 인스턴스 생성 [spec](https://docs.example.com/db-spec) -- blocked: VPC 설정 완료 후 진행 예정
  - [x] Redis 클러스터 설정
  - [x] 프로젝트 네이밍 확정
  - [ ] CDN 구성
  - [ ] 모니터링 대시보드 세팅 @bob
  > 03-05 15:48: CDN은 CloudFront 사용 확정. 도메인: cdn.example.com
  > 03-05 14:24: Redis 클러스터 설정 완료. 네이밍 컨벤션 확정

### P1
- [!] 결제 취소 타이밍 이슈 수정 @charlie #bug [slack](https://slack.example.com/...) -- blocked: QA 검증 대기
  - [ ] 결제 취소 미처리 건 수정
  - [ ] 배포 후 모니터링
  > 03-05 14:34: PG 취소는 정상. 주문 상태만 미반영. 수정배포 예정
- [>] API 설계 @alice %my-project #feat ~2d
  - [ ] endpoint 정의
  - [ ] request/response schema
  - [ ] API 문서화
  - [ ] mock server 구성

### P2
- [ ] 코드 리뷰 @alice #review ~1h
```

**This example demonstrates:**
- Status markers: `[x]`, `[>]`, `[!]`, `[ ]`
- Metadata tokens: `@assignee`, `%topic`, `#tag`, `~duration`, `YYYY-MM-DD`
- Reference links: `[text](url)`
- Subtasks with independent status
- Progress notes with timestamps (`> MM-DD HH:mm:`)
- Blocker syntax (`-- blocked: reason`)
- Priority separation (P0/P1/P2)

**Carry-over example** (next day):

```markdown
## Fri 03-06

### P0
- [ ] 서버 인프라 구성 @alice %my-project #ops 2026-03-05 <- Thu [jira](https://jira.example.com/PROJ-101)
  - [!] DB 인스턴스 생성 [spec](https://docs.example.com/db-spec) -- blocked: VPC 설정 완료 후 진행 예정
  - [x] Redis 클러스터 설정
  - [x] 프로젝트 네이밍 확정
  - [ ] CDN 구성
  - [ ] 모니터링 대시보드 세팅 @bob
  > 03-05 15:48: CDN은 CloudFront 사용 확정. 도메인: cdn.example.com
  > 03-05 14:24: Redis 클러스터 설정 완료. 네이밍 컨벤션 확정
```

Note: `<- Thu` marker indicates this task was carried from Thursday. Subtask states and notes are preserved as-is.

---

## Priority Levels

| Level | Meaning | Usage |
|-------|---------|-------|
| P0 | Urgent | Must complete today, critical blockers |
| P1 | Important | Should complete today, scheduled work |
| P2 | Nice to have | Can defer, low priority |

---

## Topics File (`topics.md`)

```markdown
# Topics

> Active projects and areas of work. Tasks use %topic-name to link here.

## Active
- **my-project**: Backend API 리뉴얼 프로젝트
- **platform-migration**: 플랫폼 이관 프로젝트

## Archived
- **old-project**: 완료된 프로젝트
```

---

## Backlog File (`backlog.md`)

```markdown
# Backlog

## P1
- [ ] Task with details %topic #tag
  - [ ] Subtask

## P2
- [ ] Lower priority item

## Ideas
- [ ] Someday/maybe items
```

---

## Weekly Template (`templates/weekly.md`)

```markdown
# YYYY-WXX (Sun MM-DD ~ Sat MM-DD)

## Sun MM-DD

### P0

### P1

### P2

---

## Mon MM-DD

### P0

### P1

### P2

---

## Tue MM-DD

### P0

### P1

### P2

---

## Wed MM-DD

### P0

### P1

### P2

---

## Thu MM-DD

### P0

### P1

### P2

---

## Fri MM-DD

### P0

### P1

### P2

---

## Sat MM-DD

### P0

### P1

### P2
```

When creating a new week file, replace all `YYYY-WXX`, `MM-DD`, and day names with actual values.
