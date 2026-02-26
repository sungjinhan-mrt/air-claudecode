# Git 워크플로

## 브랜치 구조 ([Git Flow](https://git-flow.sh/workflows/gitflow/))

| 브랜치 | 기반 | 병합 대상 | 용도 | 예시 |
|--------|------|-----------|------|------|
| `main` | - | - | 프로덕션 코드 | - |
| `develop` | `main` | - | 통합 브랜치 | - |
| `feature/*` | `develop` | `develop` | 신규 기능 | `feature/PROJ-123-add-login` |
| `release/*` | `develop` | `main` + `develop` | 릴리스 준비 | `release/1.2.0` |
| `hotfix/*` | `main` | `main` + `develop` | 긴급 프로덕션 수정 | `hotfix/PROJ-456-fix-null-pointer` |
| `support/*` | `main` | - | 장기 지원 | `support/1.0.x` |

**네이밍:** `{type}/{description}` — 소문자, 단어 사이 하이픈, Jira 티켓 ID 포함 권장.

## Conventional Commits

형식: `{type}({scope}): {description}`

| 타입 | 설명 |
|------|------|
| `feat` | 신규 기능 |
| `fix` | 버그 수정 |
| `refactor` | 코드 리팩터링 |
| `test` | 테스트 추가·수정 |
| `docs` | 문서 |
| `chore` | 빌드, CI, 도구 |
| `style` | 포맷팅, 공백 |
| `perf` | 성능 개선 |
| `build` | 빌드 시스템·의존성 |
| `ci` | CI 설정 변경 |

**규칙:** 명령형(`add`, `fix`, `update`)으로 작성한다. 타입/스코프 뒤에 대문자를 쓰지 않는다. 마침표를 붙이지 않는다. 제목은 72자 이내로 한다. 본문에는 무엇을 왜 바꿨는지 작성한다.

**예시:**
```
feat(auth): add OAuth2 login with Google

Allow users to sign in using their Google account.
Reduces friction in onboarding.

Refs: PROJ-123
```

## 병합 전략

| 동작 | 전략 |
|------|------|
| Feature → develop | **Squash and merge** (깨끗한 히스토리, 기능당 커밋 하나) |
| Release → main | **Merge commit** (릴리스 히스토리 보존) |
| Hotfix → main + develop | **Merge commit** (수정 히스토리 보존) |
| develop에서 feature 업데이트 | **Rebase** (선형 히스토리 유지) |

## 워크플로 요약

| 시나리오 | 분기 대상 | PR 전략 | 병합 후 태그 |
|----------|-----------|---------|-------------|
| Feature | `develop` | Squash and merge → `develop` | 없음 |
| Release | `develop` | Merge commit → `main` + `develop` | `v{major}.{minor}.{patch}` |
| Hotfix | `main` | Merge commit → `main` + `develop` | `v{major}.{minor}.{patch}` |

**일반 절차:** 브랜치 생성 → 커밋 → PR 생성 → 병합 → 브랜치 삭제 → 태그(릴리스/핫픽스).

## 태그 규칙

형식: `v{major}.{minor}.{patch}`

| 세그먼트 | 증가 시점 |
|----------|----------|
| Major | 하위 호환이 깨지는 API 변경 |
| Minor | 하위 호환 가능한 신규 기능 |
| Patch | 하위 호환 가능한 버그 수정 |

예시: `v1.0.0`, `v1.2.3`, `v2.0.0`

## 보호 브랜치

- `main` / `develop`: PR만 허용, 강제 푸시 금지, 삭제 금지
- `feature/*` / `hotfix/*`: 직접 푸시 허용, 병합 후 삭제
