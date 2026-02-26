# 도메인 예외 처리

> 각 도메인 기능은 고유한 `{Feature}Error` Enum, `{Feature}Exception` 기본 클래스, 세부 예외 하위 클래스를 가진다.

## 예외 계층

```
BizRuntimeException (common) -- 복구 불가 비즈니스 오류, 스택 트레이스 포함
BizException (common) -- 복구 가능 비즈니스 오류, 스택 트레이스 포함
KnownException (common) -- 예상 가능한 오류 (유효성 검증, 미존재), 스택 트레이스 없음
  └── {Feature}Exception (domain) -- 기능별 기본, open class
        ├── {Feature}NotFoundException
        ├── {Feature}AlreadyExistsException
        └── {Feature}InvalidStateException
```

| 클래스 | 모듈 | 용도 | HTTP 상태 | 스택 트레이스 |
|--------|------|------|-----------|---------------|
| `BizRuntimeException` | common | 복구 불가 오류 (데이터 무결성 장애) | 500 | 포함 |
| `BizException` | common | 복구 가능 비즈니스 오류 | 500 | 포함 |
| `KnownException` | common | 예상 가능한 오류 — INFO로 로깅 | 406 | 없음 |
| `{Feature}Exception` | domain | 기능별 기본, `KnownException` 상속 | 406 | 없음 |
| `{Feature}NotFoundException` | domain | 기능 내 엔티티 미존재 | 406 | 없음 |

---

## 패키지 구조

```
domain/{feature}/
└── exception/
    ├── {Feature}Error.kt        # ResponseCode를 구현하는 에러 코드 Enum
    └── {Feature}Exception.kt    # 기본 예외 + 모든 하위 클래스
```

---

## 에러 코드 Enum

```kotlin
enum class HolidayError(
    override val code: String,
    override val message: String,
    override val status: HttpStatus = HttpStatus.NOT_ACCEPTABLE,
) : ResponseCode {
    NOT_FOUND("HOLIDAY_001", "공휴일 정보를 찾을 수 없습니다."),
    ALREADY_EXISTS("HOLIDAY_002", "이미 등록된 공휴일입니다."),
    INVALID_DATE_RANGE("HOLIDAY_003", "공휴일 날짜 범위가 올바르지 않습니다."),
    CANNOT_DELETE_PAST("HOLIDAY_004", "이미 지난 공휴일은 삭제할 수 없습니다."),
}
```

### 네이밍 규칙

| 요소 | 표기법 | 예시 |
|------|--------|------|
| Enum 클래스명 | `{Feature}Error` | `HolidayError` |
| 상수명 | `SCREAMING_SNAKE_CASE` | `NOT_FOUND`, `ALREADY_EXISTS` |
| 코드값 | `{FEATURE}_{3자리 순번}` | `HOLIDAY_001` |
| 메시지 언어 | 한글 | `"공휴일 정보를 찾을 수 없습니다."` |
| 기본 HTTP 상태 | `406 NOT_ACCEPTABLE` | `HttpStatus.NOT_ACCEPTABLE` |

기능별 오류에는 `{Feature}Error`를 사용한다. API 계층의 범용 유효성 검증이나 입력 형식 오류에는 공통 `ErrorCode`를 사용한다.

---

## 예외 클래스

```kotlin
// 기본 예외 — open class여야 한다
open class HolidayException(
    error: HolidayError,
    message: String = error.message,
) : KnownException(error, message)

// 특정 하위 클래스
class HolidayNotFoundException(holidayId: Long) : HolidayException(
    error = HolidayError.NOT_FOUND,
    message = "공휴일 정보를 찾을 수 없습니다. holidayId=$holidayId",
)

// 하위 클래스 없이 사용 — 드물거나 일회성 오류
throw HolidayException(HolidayError.CANNOT_DELETE_PAST)
throw HolidayException(
    error = HolidayError.INVALID_DATE_RANGE,
    message = "공휴일 날짜 범위가 올바르지 않습니다. startDate=$startDate, endDate=$endDate",
)
```

### 하위 클래스 패턴

| 하위 클래스 | 생성자 파라미터 | 메시지 패턴 |
|-------------|----------------|-------------|
| `{Feature}NotFoundException` | 엔티티 식별자 (`id: Long`) | `"... 찾을 수 없습니다. {feature}Id=$id"` |
| `{Feature}AlreadyExistsException` | 유니크 키 (`date: LocalDate`) | `"이미 등록되어 있습니다. date=$date"` |
| `{Feature}InvalidStateException` | 현재 상태 값 | `"올바르지 않은 상태입니다. status=$status"` |

---

## Service에서의 사용

**Service 계층에서만** 예외를 던진다. 에러 메시지에 항상 관련 컨텍스트를 포함한다.

```kotlin
@Service
@Transactional(readOnly = true)
class HolidayService(private val holidayRepository: HolidayRepository) {

    fun findById(holidayId: Long): Holiday =
        holidayRepository.findById(holidayId) ?: throw HolidayNotFoundException(holidayId)

    @Transactional
    fun create(date: LocalDate, name: String): Holiday {
        if (holidayRepository.existsByDate(date)) {
            throw HolidayException(HolidayError.ALREADY_EXISTS, "이미 등록된 공휴일입니다. date=$date")
        }
        return holidayRepository.save(Holiday(date = date, name = name))
    }
}
```
