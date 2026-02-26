# DateTime 처리

> UTC로 저장하고 처리한다. KST 변환은 최종 표시 경계에서만 수행한다.

## 핵심 규칙

| 규칙 | 설명 |
|------|------|
| **내부 타임존** | 모든 곳에서 UTC (JVM, DB, 도메인 로직) |
| **Controller 입력** | UTC여야 한다. KST가 들어오면 즉시 UTC로 변환한다 |
| **Controller 출력** | 기본 UTC. 표시가 필요할 때만 KST로 변환한다 |
| **KST 변환** | 응답 경계(Response DTO)에서만 `.toKst()` 확장 함수를 사용한다 |
| **유틸리티** | 모든 DateTime 작업에 `{projectGroup}.common.utils.datetime`을 사용한다 |

---

## JVM 타임존 설정

모든 bootstrap `-app` 모듈에서 UTC를 JVM 기본 타임존으로 설정한다.

```kotlin
fun main(args: Array<String>) {
    TimeZone.setDefault(TimeZone.getTimeZone("UTC"))
    runApplication<MyApplication>(*args)
}
```

> **중요**: 이 설정이 없으면 `LocalDateTime.now()`가 시스템 로컬 시간(한국 서버에서는 KST)을 반환하여 불일치가 발생한다.

---

## Controller 입력: 항상 UTC

컨트롤러의 모든 DateTime 입력은 UTC여야 한다. 클라이언트가 KST를 보내면 Controller 계층에서 즉시 UTC로 변환한 후 응용 계층에 전달한다.

```kotlin
// UTC 입력 — 그대로 전달
@PostMapping("/events")
fun createEvent(@Valid @RequestBody request: CreateEventRequest): ResponseEntity<ApiResource<EventResponse>> =
    ResponseEntity.ok(ApiResource.success(EventResponse.from(createEventUseCase(request.toCommand()))))

// KST 입력 — 진입점에서 즉시 UTC로 변환
@PostMapping("/events")
fun createEvent(@Valid @RequestBody request: CreateEventRequest): ResponseEntity<ApiResource<EventResponse>> {
    val utcStartAt = request.startAt.toUtc()  // KST → UTC 변환
    return ResponseEntity.ok(ApiResource.success(EventResponse.from(
        createEventUseCase(CreateEventCommand(name = request.name, startAt = utcStartAt))
    )))
}
```

타임존 인식 입력이 필요하면 `ZonedDateTime`을 사용하고 UTC로 정규화한다:

```kotlin
data class CreateEventApiRequest(
    val name: String,
    @param:JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ssXXX'['VV']'")
    val startAt: ZonedDateTime,
)

val utcStartAt = request.startAt.withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime()
```

---

## Controller 출력: 응답 경계에서 KST 변환

API 응답 DTO를 구성할 때만 KST로 변환한다. 도메인 계층과 서비스 계층에서는 KST 변환을 수행하지 않는다.

Response DTO의 팩토리(`from()`)에서 `.toKst()`로 변환한다.

```kotlin
// Response DTO에서 — UTC → KST 변환
data class EventResponse(
    val id: Long,
    val name: String,
    val startAt: LocalDateTime,
    val createdAt: LocalDateTime,
) {
    companion object {
        fun from(result: EventResult): EventResponse =
            EventResponse(
                id = result.id,
                name = result.name,
                startAt = result.startAt.toKst(),
                createdAt = result.createdAt.toKst(),
            )
    }
}
```

---

## DateTime 생명주기

```
[Client Request]
  UTC datetime input (or KST → convert to UTC immediately)
    ↓
[Controller]
  Ensure UTC before passing to application
    ↓
[Application (UseCase → Application Service → Domain Model)]
  All operations in UTC. No KST awareness.
    ↓
[Database]
  Stored as UTC
    ↓
[Application → Response DTO]
  Convert to KST with .toKst() only if display requires it
    ↓
[Client Response]
  KST for display, or UTC for machine-to-machine
```

---

## 유틸리티 클래스

> **중요**: 모든 DateTime 작업에 `{projectGroup}.common.utils.datetime`을 사용한다. `java.time` 직접 포맷팅이나 수동 계산을 사용하지 않는다.

### DateFormatter (파싱 및 포맷팅)

| 메서드 | 결과 |
|--------|------|
| `"2025-01-24".toDate()` | `LocalDate` |
| `"20250124".numericToDate()` | `LocalDate` |
| `"2025-01-24T14:30:00".toDateTime()` | `LocalDateTime` |
| `date.toStr()` | `"2025-01-24"` |
| `date.toNumericStr()` | `"20250124"` |
| `date.toKorean()` | `"2025년 1월 24일"` |
| `dateTime.toStr()` | `"2025-01-24T14:30:00"` |
| `dateTime.toKorean()` | `"2025년 1월 24일 14시 30분"` |

### 타임존 변환

| 메서드 | 방향 | 용도 |
|--------|------|------|
| `LocalDateTime.toKst()` | UTC → KST | Response DTO에서 표시용 |
| `ZonedDateTime.toKst()` | UTC → KST | Response DTO에서 표시용 |
| `LocalDateTime.toUtc()` | KST → UTC | Controller 경계에서 KST 입력 정규화 |
| `ZonedDateTime.toUtc()` | KST → UTC | Controller 경계에서 KST 입력 정규화 |

### SearchDates (쿼리용 날짜 범위)

```kotlin
val dates = SearchDates.lastMonth()
val dates = SearchDates.of(startDate, endDate)
val dates = SearchDates.lastDays(7)
val dates = SearchDates.thisWeek()

data class OrderSearchCondition(
    val status: OrderStatus? = null,
    val searchDates: SearchDates = SearchDates.lastMonth(),
)
```

### Range 클래스

```kotlin
val range = LocalDateRange(startDate, endDate)
date in range                // 포함 여부 확인
range.overlaps(otherRange)   // 겹침 확인
range.daysBetween()          // 일수 계산

val dtRange = LocalDateTimeRange(startDt, endDt)
dtRange.hoursBetween()
```

### Date 확장 함수

```kotlin
date.isToday()
date.isPast()
birthDate.getAge()           // 만 나이
birthDate.getKoreanAge()     // 한국 나이
```

---

## ISO-8601 형식

| 타입 | 형식 | 예시 |
|------|------|------|
| Date | `yyyy-MM-dd` | `2025-01-02` |
| Time | `HH:mm:ss` | `14:30:00` |
| DateTime | `yyyy-MM-dd'T'HH:mm:ss` | `2025-01-02T14:30:00` |
| DateTime UTC | `yyyy-MM-dd'T'HH:mm:ss'Z'` | `2025-01-02T05:30:00Z` |
| ZonedDateTime | `yyyy-MM-dd'T'HH:mm:ssXXX'['VV']'` | `2025-01-02T14:30:00+09:00[Asia/Seoul]` |
