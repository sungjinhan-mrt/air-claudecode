# 도메인 패턴

## 공통 코드와 Enum

분류가 필요한 모든 도메인 코드는 `{projectGroup}.common.codes`의 `CommonCode`를 구현한다.

```kotlin
interface CommonCode {
    val code: String        // 기계 판독용 코드값
    val description: String // 사람이 읽을 수 있는 설명
    val name: String        // Enum 상수 이름
}
```

### 규칙

- `code`와 `description` 프로퍼티로 `CommonCode`를 구현한다
- Enum 클래스: `PascalCase` (`OrderStatus`), 상수: `SCREAMING_SNAKE_CASE` (`PENDING`)
- 외부 코드 매핑을 위한 `fromCode()` companion 메서드를 제공한다
- 항상 `@Enumerated(EnumType.STRING)` — `ORDINAL`을 사용하지 않는다
- `@Column(length = N)`을 가장 긴 상수 이름에 맞춰 설정한다

### CommonCode 사용 시점

| 사용 | 미사용 |
|------|--------|
| 비즈니스 상태 코드 | 응답 코드 (`ResponseCode` 사용) |
| 분류/유형 구분 | 내부 플래그 (일반 enum) |
| 역할/권한 유형 | 타입 계층을 위한 sealed class |

### 패키지 위치

- 도메인 특정: `domain/{feature}/entity/`
- 도메인 간 공유: `domain/common/codes/`
- 공통 모듈: `common/codes/`

## 도메인 예외 처리

> 각 기능은 고유한 `{Feature}Error` Enum, `{Feature}Exception` 기본 클래스, 세부 하위 클래스를 가진다.

### 예외 계층

| 클래스 | 기본 클래스 | 용도 | 로그 |
|--------|-------------|------|------|
| `KnownException` | common | 예상 가능한 오류 (유효성 검증, 미존재) | INFO, 스택 트레이스 없음 |
| `BizRuntimeException` | common | 복구 불가 비즈니스 오류 | ERROR, 스택 트레이스 포함 |
| `{Feature}Exception` | `KnownException` | 기능별 기본 (`open class`) | INFO |
| `{Feature}NotFoundException` | `{Feature}Exception` | 특정 하위 클래스 | INFO |

### 에러 코드 Enum

- 각 기능은 `ResponseCode`를 구현하는 `{Feature}Error` Enum을 정의한다
- 메시지는 한글로 작성한다
- 모든 도메인 비즈니스 예외는 HTTP 상태 코드 `406`을 사용한다

### 패키지 구조

각 기능: `domain/{feature}/exception/`
- `{Feature}Error.kt` (Enum)
- `{Feature}Exception.kt` (기본 + 하위 클래스)

### 사용 규칙

- **Service 계층에서만** 예외를 던진다 — UseCase나 Controller에서 던지지 않는다
- 에러 메시지에 관련 컨텍스트(id, date, name)를 포함한다
- 전제 조건 검증에 `knownRequired` / `knownRequiredNotNull`을 사용한다

## DateTime 처리

> UTC로 저장하고 처리한다. KST 변환은 최종 표시 경계에서만 수행한다.

### 핵심 규칙

| 규칙 | 설명 |
|------|------|
| 내부 타임존 | 모든 곳에서 UTC (JVM, DB, 도메인 로직) |
| Controller 입력 | UTC여야 한다. KST가 들어오면 즉시 변환한다 |
| Controller 출력 | 기본 UTC. 표시용으로만 KST |
| KST 변환 | Response DTO에서만 `.toKst()` 사용 |

### JVM 설정

모든 bootstrap `-app`의 main()에 `TimeZone.setDefault(TimeZone.getTimeZone("UTC"))`를 설정한다.

### DateTime 생명주기

```
Client Request (UTC, or KST → convert to UTC immediately)
  → Controller (ensure UTC)
    → Domain (all operations in UTC)
      → Database (stored as UTC)
        → Response DTO (.toKst() only if display requires)
```

### 변환 확장 함수

- `LocalDateTime.toKst()` / `.toUtc()` — `{projectGroup}.common.utils.extensions` 제공
- `plusHours(9)` 사용 금지 — 항상 `.toKst()` / `.toUtc()` 사용
- `DateTimeFormatter` 직접 사용 금지 — common 모듈의 `DateFormatter` 사용

### 안티패턴

- main()에서 `TimeZone.setDefault(UTC)` 누락 → `now()`가 KST를 반환
- Domain이나 UseCase에서 `.toKst()` 호출 → 도메인이 표시 관심사에 오염
- 날짜 필드에 `String` 타입 사용 → `LocalDate`, `LocalDateTime`, `ZonedDateTime` 사용
