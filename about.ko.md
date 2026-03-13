# air-claudecode: AI 시대의 팀 코드 일관성을 해결

## 한 줄 요약

air-claudecode는 Claude Code 플러그인이다. AI가 생성하는 코드, 커밋 메시지, 리뷰 결과가 팀 표준을 따르도록 스킬, 에이전트, 컨벤션, Hook을 하나의 패키지로 제공한다.

---

## AI가 만든 코드, 왜 제각각인가

같은 팀, 같은 프로젝트, 같은 AI 도구를 쓰는데 결과물은 다르다. 주문 조회 기능을 AI로 만든 두 개발자의 코드를 비교해 보자.

**개발자 A의 AI가 만든 코드:**

```kotlin
@Service
class OrderService {
    @Autowired
    private lateinit var orderRepository: OrderRepository

    fun getOrder(id: Long): Map<String, Any> {
        val order = orderRepository.findById(id).orElseThrow()
        return mapOf("orderId" to order.id, "status" to order.status)
    }
}
```

**개발자 B의 AI가 만든 코드:**

```kotlin
@Service
class OrderService(
    private val orderRepository: OrderRepository,
) {
    fun getOrder(id: Long): OrderResponse {
        val order = orderRepository.findById(id)
            .orElseThrow { OrderNotFoundException(id) }
        return OrderResponse.from(order)
    }
}
```

같은 기능인데 DI 방식, 예외 처리, 응답 구조가 전부 다르다. 이 코드가 하나의 프로젝트에 섞여 들어간다.

이 상황이 만드는 문제는 세 가지다.

1. **코드 리뷰가 스타일 논쟁으로 변질된다.** 리뷰어가 로직 대신 "필드 주입 말고 생성자 주입으로 바꿔주세요" 같은 스타일 지적에 시간을 쓴다.
2. **히스토리 추적이 어렵다.** 커밋 메시지가 "주문 조회 기능 추가", "feat: add order lookup API", "update OrderService"로 제각각이면 릴리즈 노트 자동화가 불가능하다.
3. **신규 입사자가 혼란에 빠진다.** 파일마다 DI 방식이 다르면 "우리 팀 표준이 뭔가요?"에 답할 수 없다.

AI가 속도를 높일수록 일관성 없는 코드가 더 빠르게 쌓인다. 핵심 질문은 이것이다.

> AI가 코드를 대신 써주는 시대에, 팀의 코드 일관성은 누가 책임지는가?

---

## 3번의 시도, 2번의 실패

### 시도 1: 슬랙으로 파일 공유

스킬 파일을 만들어서 슬랙에 공유했다.

> "커밋 메시지 컨벤션 스킬 만들었습니다. 첨부 파일을 `~/.claude/skills/` 폴더에 넣어주세요."

실제로 설치한 사람은 없었다. 슬랙에서 좋아요를 누르는 것과 파일을 복사해서 특정 폴더에 넣는 것 사이에는 거대한 간극이 있다. 도입률은 사실상 0%였다.

### 시도 2: Git 레포 + 설치 스크립트

하나의 Git 레포에 모든 스킬을 모아놓고 설치 스크립트를 제공했다.

설치한 사람이 1명 있었다. 하지만 며칠 후, 다른 팀원의 PR을 보니 스킬을 사용하지 않았다. 결국 자리에 직접 가서 설치를 해드렸다. 도구를 만든 사람이 직접 돌아다니며 설치해주는 방식은 팀 전체로 확산할 수 없다.

설치가 끝이 아니었다. 스킬에 버그가 있어서 수정했는데, 팀원들이 `git pull`을 하지 않는다. 누구는 v3를 쓰고, 누구는 아직 미설치 상태다. **설치는 한 번이지만, 업데이트는 영원히 계속된다.** 업데이트가 자동이 아니면 버전은 반드시 어긋난다.

### 시도 3: 플러그인 마켓플레이스

설치 과정에서 마찰을 없애는 방법을 고민했다. 답은 Claude Code의 마켓플레이스 플러그인 시스템이었다.

```bash
# 설치
/plugin marketplace add https://github.com/sungjinhan-mrt/air-claudecode
/plugin install air-claudecode

# 업데이트
/plugin update air-claudecode
```

설치는 명령어 두 줄, 업데이트는 한 줄이다. 모든 팀원이 같은 버전으로 동기화된다.

| 비교 항목 | 시도 1 | 시도 2 | 시도 3 |
|-----------|--------|--------|--------|
| 설치 방법 | 파일 수동 복사 | 레포 클론 + 스크립트 | 명령어 한 줄 |
| 버전 통일 | 불가능 | 수동 pull | 자동 보장 |
| 도입률 | 0% | 1명 | 확산 |

> 최고의 도구는 사람들이 실제로 사용하는 도구다.

---

## 5개 레이어 구조

air-claudecode는 5개 레이어로 구성된다.

| 레이어 | 역할 | 비유 |
|--------|------|------|
| **Skills** | AI가 따라야 할 작업 절차 정의 (20개) | 레시피 |
| **Agents** | 특정 관점에 특화된 AI 페르소나 (12개) | 전문 셰프 |
| **Conventions** | 팀이 합의한 코딩 표준 | 맛의 기준 |
| **Hooks** | 물리적 차단 + 자동 주입 장치 | 주방 안전 장치 |
| **Plugins** | 플러그인 안에 플러그인을 넣는 중첩 구조 | 확장 가능한 주방 |

스킬이 "무엇을 할 것인가"라면, 에이전트는 "어떤 관점으로 할 것인가"이고, 컨벤션은 "어떤 기준으로 할 것인가"이다. Hook은 이 모든 것이 실제로 지켜지도록 물리적으로 강제하는 장치다.

### 다층 방어가 필요한 이유

한 가지만으로는 안 된다.

- **1층: 프롬프트 (Skills)** -- AI의 행동 절차를 지시한다. 그러나 AI는 지시를 확률적으로 따르기 때문에 100% 보장이 안 된다.
- **2층: 가드레일 (Hooks)** -- 프롬프트를 무시해도 물리적으로 차단한다. 승인 없이 커밋하면 실행 자체가 막힌다.
- **3층: 컨텍스트 자동 주입 (Conventions)** -- AI가 참조할 규칙을 항상 제공한다. 사용자가 "이 파일 읽어봐"라고 말할 필요가 없다.

어느 한 층이 뚫려도 다른 층이 보완한다. 이것이 air-claudecode의 설계 철학이다.

---

## 스킬 카탈로그

총 20개의 스킬이 3개 카테고리로 나뉜다.

### 개발 워크플로우

코드를 쓰고, 리뷰하고, 커밋하고, PR을 올리는 전 과정을 다룬다.

| 스킬 | 하는 일 |
|------|---------|
| `software-engineer` | 팀 컨벤션이 적용된 Kotlin/Spring 코드 생성 |
| `code-review` | 심각도 분류(P0~NIT) + 팀 컨벤션 기반 한국어 코드 리뷰 |
| `test-engineer` | JUnit5/AssertJ/Kotest 기반 테스트 코드 생성 |
| `git-commit` | Conventional Commits + Jira 자동 연동 커밋 |
| `git-branch` | Jira 이슈에서 브랜치명 자동 생성 |
| `git-pr-master` | PR 생성/리뷰/머지 관리 |
| `git-issue-master` | GitHub 이슈 CRUD + Jira 연동 |
| `git-flow-master` | Git Flow 브랜치 라이프사이클 관리 |
| `deep-dive-plan` | 코드 작성 전 병렬 분석 + 전략 수립 |

### 협업 도구

개발 외 업무를 자동화한다.

| 스킬 | 하는 일 |
|------|---------|
| `jira-master` | Jira 티켓 CRUD |
| `confluence-master` | Confluence 페이지 CRUD |
| `slack-master` | Slack 메시지 읽기/검색/전송 |
| `gog-calendar` | Google Calendar 일정 관리 |
| `log-analyzer` | OpenSearch 로그 검색/분석 |

### 유틸리티

문서와 코드 품질을 관리한다.

| 스킬 | 하는 일 |
|------|---------|
| `technical-writing` | toss/technical-writing 방법론 기반 기술 문서 작성 |
| `sentence-refiner` | 한국어 기술 문서 문장 교정 |
| `sql-generator` | 팀 SQL 스타일 가이드 기반 쿼리 생성 |
| `xsd-to-kotlin` | XSD 스키마를 Kotlin data class로 변환 |
| `todo` | 마크다운 기반 주간 할일 관리 |
| `setup-air-cc` | 환경 진단 + 원클릭 설치 |

---

## 핵심 스킬 상세

### git-commit: 커밋 메시지를 시스템이 관리한다

사용자가 "커밋 해줘"라고 말하면 3단계 워크플로우를 실행한다.

1. **Gather** -- `git status`, `git diff`, 브랜치 이름, 최근 커밋을 한 번에 수집한다. 브랜치 이름에서 Jira 티켓 번호(`feature/PROJ-123-desc` → `Refs: PROJ-123`)나 GitHub 이슈 번호(`fix-#42` → `Closes #42`)를 자동 감지한다.
2. **Draft** -- 실제 diff를 읽고 Conventional Commits 포맷으로 메시지를 작성한다. 변경 사항 중 AI가 작성한 비율을 `AI-authored: N%`로 항상 포함한다.
3. **Confirm** -- 브랜치명, 변경 파일 목록, 커밋 메시지를 미리보기로 보여준다. 사용자가 Commit / Edit / Cancel 중 하나를 선택한다. Commit을 선택해야만 커밋이 실행된다.

```
Branch: feature/PROJ-456-jwt-refresh

Changed files:
  M  src/auth/login.ts
  A  src/auth/token.ts

Commit message:
─────────────────
feat(auth): add JWT refresh token rotation

Implement automatic token refresh to prevent session
expiration during active usage.

Refs: PROJ-456
AI-authored: 90%
─────────────────
```

Auto Mode(`--auto`, "자동 커밋")를 사용하면 Confirm 단계를 건너뛰고 바로 커밋한다. diff에 관련 없는 변경 사항이 섞여 있으면 커밋을 분리하도록 제안한다.

사용자는 커밋 포맷을 외울 필요도, Jira 번호를 직접 입력할 필요도 없다.

### code-review: 리뷰어를 스타일 논쟁에서 해방한다

"코드 리뷰 해줘"라고 말하면, AI가 팀 컨벤션을 기준으로 코드를 분석한다. 결과는 심각도별로 분류된다.

| 심각도 | 의미 | 예시 |
|--------|------|------|
| `[BLOCKING]` | 머지 불가 | 보안 취약점, 데이터 손실 위험 |
| `[MAJOR]` | 수정 필요 | 예외 처리 누락, 컨벤션 위반 |
| `[MINOR]` | 개선 권장 | DTO 팩토리 메서드 미사용 |
| `[NIT]` | 선택 사항 | 네이밍 개선 제안 |

출력은 한국어다. 리뷰어가 반복적으로 지적하던 스타일 이슈를 AI가 자동으로 잡아낸다. 리뷰어는 비즈니스 로직과 설계에 집중할 수 있다.

### software-engineer: 누가 써도 같은 구조의 코드가 나온다

"주문 취소 API 만들어줘"라고 말하면, AI가 팀 컨벤션을 적용해서 코드를 생성한다.

- 생성자 주입을 사용한다. (`@Autowired` 필드 주입 금지)
- `ApiResource` 래퍼로 응답을 감싼다.
- 커스텀 예외 `OrderNotFoundException`을 사용한다.
- `data class` DTO를 만든다.
- 4계층 아키텍처(Controller → Facade → Application → Service)를 따른다.

구현 후에는 자동으로 `test-engineer`와 `code-review` 스킬을 호출한다. 코드 작성 → 테스트 → 리뷰가 하나의 워크플로우로 연결된다.

---

## 에이전트 카탈로그

12개의 에이전트가 각자의 전문 관점으로 동작한다.

| 에이전트 | 역할 | 전문 영역 |
|----------|------|-----------|
| `software-engineer` | 코드 구현 | Kotlin/Spring, Clean Code, KISS/DRY/YAGNI |
| `code-reviewer` | 코드 리뷰 | 심각도 분류, OWASP Top 10, 성능 병목 |
| `test-engineer` | 테스트 작성 | JUnit5, AssertJ, Kotest |
| `technical-writer` | 기술 문서 | toss/technical-writing 방법론 |
| `sentence-refiner` | 문장 교정 | 한국어 기술 문서 문장 규칙 |
| `jira-master` | Jira 관리 | 티켓 CRUD, 프로젝트/타입 선택 |
| `confluence-master` | Confluence 관리 | 페이지 CRUD, 공간/라벨 관리 |
| `slack-master` | Slack 관리 | 메시지 읽기/검색/전송 |
| `log-analyzer` | 로그 분석 | OpenSearch 쿼리, KST 타임스탬프 |
| `git-flow-master` | Git Flow | 브랜치 라이프사이클, Jira 연동 |
| `git-pr-master` | PR 관리 | PR CRUD, 리뷰어/라벨 제안 |
| `git-issue-master` | Issue 관리 | GitHub 이슈 CRUD, Jira 연동 |

스킬이 "무엇을 할 것인가"를 정의한다면, 에이전트는 "어떤 관점과 규칙으로 할 것인가"를 정의한다. `software-engineer` 에이전트는 코드를 구현할 때 Clean Code 원칙, Kotlin 이디엄, 4계층 아키텍처 규칙을 자동으로 적용한다.

---

## 컨벤션: 코드로 관리하는 팀 표준

`plugins/air-claudecode/conventions/` 디렉토리에 팀이 합의한 코딩 표준이 마크다운으로 정리되어 있다.

```
plugins/air-claudecode/conventions/
  naming-conventions.md      # 네이밍 규칙 (클래스, DTO, URL, 테스트 등)
  git-workflow.md            # Git Flow, 커밋, 머지 전략
  project-conventions/
    10-architecture/         # 4계층 아키텍처, 모듈 구조
    20-api/                  # Controller, Request/Response, REST Docs
    30-spring/               # 어노테이션 순서, 비동기 이벤트
    40-domain/               # 공통 코드, DateTime, 도메인 예외
    50-data/                 # JPA, QueryDSL, SQL
    60-concurrency.md        # 동시성 처리
    70-common-module.md      # 공통 모듈
```

이 컨벤션은 단순한 문서가 아니다. `air-guide-injector` Hook이 사용자가 프롬프트를 입력할 때마다 해당 프로젝트의 컨벤션을 AI 컨텍스트에 자동 주입한다. 노션에 작성한 컨벤션 문서는 3개월 후에 아무도 보지 않지만, AI 컨텍스트로 주입된 컨벤션은 매일 적용된다.

---

## Hook: AI에게 부탁하지 말고, 시스템으로 강제한다

air-claudecode의 Hook은 3개 시점에서 동작한다.

```json
{
  "SessionStart":      [ "session-start.mjs" ],
  "UserPromptSubmit":  [ "keyword-detector.mjs", "air-guide-injector.mjs" ],
  "PreToolUse(Bash)":  [ "commit-guard.mjs", "pr-guard.mjs" ]
}
```

### commit-guard: 승인 없는 커밋을 물리적으로 차단한다

AI가 `git commit`을 실행하려 하면, Hook이 승인 마커 파일(`/tmp/.air-commit-approved`)의 존재를 확인한다. 마커가 없으면 커밋 자체가 실행되지 않는다.

```
사용자 "커밋 해줘"
  → AI가 미리보기를 보여줌
  → 사용자가 Commit 선택
  → AI가 마커 파일 생성
  → AI가 git commit 실행
  → Hook이 마커 확인 → 허용 → 마커 삭제 (1회용)
```

프롬프트에 "반드시 사용자 확인을 받으라"고 명시해도, AI는 확인 단계를 건너뛸 수 있다. 프롬프트는 "부탁"이지 "강제"가 아니기 때문이다. Hook은 이 한계를 보완한다.

### keyword-detector: 자연어가 곧 명령어다

사용자가 프롬프트를 입력하면, Hook이 키워드를 감지해서 해당 스킬을 자동으로 연결한다.

| 사용자 입력 | 감지 키워드 | 연결 스킬 |
|------------|------------|-----------|
| "커밋 해줘" | 커밋 | `git-commit` |
| "코드 리뷰 해줘" | 코드 리뷰 | `code-review` |
| "지라 티켓 만들어줘" | 지라 | `jira-master` |
| "로그 검색해줘" | 로그 | `log-analyzer` |

20개 스킬의 이름을 외울 필요가 없다. 한국어와 영어 키워드를 모두 인식한다.

### air-guide-injector: 프로젝트별 컨벤션을 자동으로 주입한다

이 Hook은 air-claudecode의 핵심 기능 중 하나다. 사용자가 프롬프트를 입력할 때마다, 현재 작업 디렉토리가 대상 레포인지 확인하고, 맞으면 해당 프로젝트의 개발 가이드를 AI 컨텍스트에 자동 주입한다.

**동작 방식:**

1. `UserPromptSubmit` 시점에 실행된다. 사용자가 프롬프트를 입력할 때마다 매번 동작한다.
2. 현재 작업 디렉토리(`cwd`)가 대상 레포 안인지 확인한다. 디렉토리 경로에 대상 레포 이름이 포함되어 있거나, 워크스페이스 루트에 대상 레포 폴더가 있으면 감지한다.
3. 대상 레포로 감지되면, `plugins/air-claudecode/reference/air-project-guide/index.md`를 읽어서 AI 컨텍스트에 주입한다.

**매 프롬프트마다 실행하는 이유:** Claude Code는 대화가 길어지면 이전 컨텍스트를 압축한다. 세션 시작 시 한 번만 주입하면 압축 과정에서 가이드가 사라진다. 매 프롬프트마다 주입하면 컨텍스트 압축이나 레포 전환에도 가이드가 유지된다.

**대상 레포:**

| 레포 | 설명 |
|------|------|
| `air-console` | 콘솔 애플리케이션 |
| `air-insurance` | 보험 서비스 |
| `air-international` | 국제선 서비스 |
| `air-navigator` | 네비게이터 서비스 |
| `air-notification` | 알림 서비스 |
| `air-pricing` | 가격 서비스 |
| `air-reconciliation` | 정산 서비스 |

**주입되는 가이드 구조:** 40개의 개발 가이드 문서가 AI용(영문)과 사람용(한국어) 두 버전으로 제공된다.

```
plugins/air-claudecode/reference/air-project-guide/
  index.md                    # 키워드 → 가이드 파일 룩업 테이블
  ai/                         # AI 컨텍스트용 (영문)
    architecture/
      module-structure.md     # 패키지 구조, 레이어 의존성 규칙
      cross-cutting-concerns.md  # ApiResource, 응답 코드, 관측성
    development-guide/
      api/                    # Controller, Request/Response DTO
      common/                 # 네이밍, 예외, 로깅, 동시성, 테스트 등
      persistence/            # JPA, QueryDSL, 트랜잭션
  ko/                         # 사람이 읽는 한국어 버전
    ...                       # 동일 구조
```

AI에게는 룩업 테이블이 주입된다. AI가 "controller를 작성해야 하는 상황"이라면 룩업 테이블에서 `controller` 키워드에 매칭되는 `controller-guide.md`를 찾아서 읽은 뒤 코드를 작성한다. 사용자가 "가이드 파일 읽어봐"라고 말할 필요가 없다.

**핵심 가이드 목록:**

| 키워드 | 가이드 | 내용 |
|--------|--------|------|
| controller, URL, REST | `controller-guide.md` | URL 설계, 컨트롤러 패턴, 페이지네이션 |
| request, response, DTO | `api-guide.md` | DTO 설계, Bean Validation, 에러 응답 |
| exception, error handling | `exception-guide.md` | 예외 계층, GlobalExceptionHandler |
| JPA, entity, association | `jpa-guide.md` | 엔티티 설계, 연관관계, Enum 매핑 |
| QueryDSL, dynamic query | `querydsl-guide.md` | QueryRepository, 동적 쿼리, 페이지네이션 |
| transaction, propagation | `transaction-guide.md` | 트랜잭션 범위, 전파, 롤백 규칙 |
| test, JUnit5, MockK | `testing-guide.md` | 테스트 포맷, 어서션, 모킹 |
| coroutine, concurrency | `concurrency-guide.md` | MDC 전파, 디스패처, 구조적 동시성 |
| logging, structured logging | `logging-guide.md` | kotlin-logging, 로그 레벨, 파이프라인 |

이 구조 덕분에 AI는 코드를 작성하기 전에 해당 프로젝트의 아키텍처, 네이밍, 예외 처리, 트랜잭션 규칙을 자동으로 참고한다. 컨벤션 문서를 노션에 정리해놓고 "읽어보세요"라고 하는 것과, AI가 매번 자동으로 참조하는 것은 완전히 다른 결과를 만든다.

---

## 설계 원칙 3가지

### 1. AI에게 부탁하지 말고, 시스템으로 강제하라

프롬프트는 "부탁"이고, Hook은 "법"이다. AI는 지시를 확률적으로 따르기 때문에 중요한 동작에는 시스템 레벨의 강제가 필요하다. `commit-guard`와 `pr-guard`가 이 원칙을 구현한다.

### 2. 사용자에게 도구를 기억하라고 하지 말고, 의도를 감지해서 연결하라

20개 스킬을 외우게 하는 것보다, 자연어에서 의도를 읽어서 자동으로 연결하는 것이 정답이다. `keyword-detector`가 이 원칙을 구현한다.

### 3. 컨텍스트 주입은 사용자가 아닌 시스템이 책임져야 한다

규칙을 문서로 남기는 것과 AI에게 자동으로 주입하는 것은 완전히 다른 결과를 만든다. `air-guide-injector`가 이 원칙을 구현한다.

---

## 시작하기

```bash
# 설치 (Claude Code에서)
/plugin marketplace add https://github.com/sungjinhan-mrt/air-claudecode
/plugin install air-claudecode

# 환경 진단 + 원클릭 설치
/air-claudecode:setup-air-cc

# 업데이트
/plugin update air-claudecode
```

설치가 끝나면 별도의 설정 없이 바로 사용할 수 있다. "커밋 해줘", "코드 리뷰 해줘", "지라 티켓 만들어줘" 같은 자연어로 시작하면 된다.

---

## 프로젝트 구조

```
air-claudecode/
  .claude-plugin/             # 마켓플레이스 레지스트리
    marketplace.json
  docs/                       # 설치 가이드
    install-guide/
  plugins/
    air-claudecode/           # 메인 플러그인
      .claude-plugin/
        plugin.json
      skills/                 # 20개 스킬 정의
        software-engineer/
        code-review/
        git-commit/
        ...
      agents/                 # 12개 에이전트 프롬프트
        software-engineer.md
        code-reviewer.md
        ...
      conventions/            # 팀 코딩 표준
        naming-conventions.md
        git-workflow.md
        project-conventions/
      hooks/                  # Hook 등록
        hooks.json
      scripts/                # Hook 실행 스크립트
        commit-guard.mjs
        pr-guard.mjs
        keyword-detector.mjs
        air-guide-injector.mjs
        session-start.mjs
      reference/              # 프로젝트별 개발 가이드
        air-project-guide/
    air-scaffold/             # 프로젝트 스캐폴딩 플러그인
```
