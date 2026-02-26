# 공통 코드와 Enum

## 핵심 규칙

분류가 필요한 모든 도메인 코드는 `{projectGroup}.common.codes`의 `CommonCode`를 구현한다. 항상 `EnumType.STRING`으로 영속화한다 — `ORDINAL`을 사용하지 않는다.

## CommonCode 인터페이스

```kotlin
interface CommonCode {
    val code: String        // 기계 판독용 코드값
    val description: String // 사람이 읽을 수 있는 설명
    val name: String        // Enum 상수 이름 (Kotlin enum 제공)
}
```

## Enum 정의

### 표준 패턴

```kotlin
enum class OrderStatus(
    override val code: String,
    override val description: String,
) : CommonCode {
    PENDING("PENDING", "Order placed, awaiting payment"),
    PAID("PAID", "Payment confirmed"),
    CANCELLED("CANCELLED", "Order cancelled"),
    ;

    companion object {
        fun fromCode(code: String): OrderStatus =
            entries.find { it.code == code }
                ?: throw IllegalArgumentException("Unknown OrderStatus code: $code")
    }
}
```

### 네이밍 규칙

| 요소 | 표기법 | 예시 |
|------|--------|------|
| Enum 클래스 | PascalCase, 설명적 명사 | `OrderStatus`, `PaymentMethod` |
| Enum 상수 | SCREAMING_SNAKE_CASE | `PENDING`, `IN_PROGRESS` |
| `code` 값 | 상수 이름 일치 또는 도메인별 코드 | `"PENDING"`, `"CC"` |
| `description` | 명확한 영어 설명 | `"Order placed, awaiting payment"` |

Enum에 companion object나 메서드가 있으면 마지막 상수 뒤에 세미콜론(`;`)을 추가한다.

## JPA Entity에서의 사용

항상 `@Enumerated(EnumType.STRING)`을 사용한다. `EnumType.ORDINAL`은 상수 순서를 변경하거나 제거할 때 조용히 깨진다.

```kotlin
@Enumerated(EnumType.STRING)
@Column(nullable = false, length = 20)   // length = 가장 긴 상수 이름 + 여유
var status: OrderStatus = OrderStatus.PENDING
```

## 조회 메서드

```kotlin
// 알 수 없는 코드에서 예외 발생
fun fromCode(code: String): PaymentMethod =
    entries.find { it.code == code }
        ?: throw IllegalArgumentException("Unknown PaymentMethod code: $code")

// 알 수 없는 코드에서 null 반환
fun fromCodeOrNull(code: String): PaymentMethod? =
    entries.find { it.code == code }
```

## CommonCode 사용 시점

| 시나리오 | CommonCode 사용 |
|----------|----------------|
| 비즈니스 상태 코드 (`OrderStatus`, `BookingStatus`) | 사용 |
| 분류/유형 구분 (`PaymentMethod`, `BookingType`) | 사용 |
| 역할/권한 유형 (`UserRole`, `MembershipTier`) | 사용 |
| 설정 플래그 (단순 `Boolean`) | 미사용 |
| 내부 전용 마커 | 미사용 — 일반 enum이나 sealed class |
| 응답 코드 | 미사용 — `ResponseCode` 인터페이스 사용 |

```kotlin
// 응답 코드는 CommonCode가 아닌 ResponseCode를 사용한다
enum class ErrorCode(
    override val status: Int,
    override val message: String,
) : ResponseCode {
    DATA_NOT_FOUND(406, "Data not found"),
}

// CommonCode 없는 내부 enum도 가능하다
enum class SortDirection { ASC, DESC }
```

## 패키지 위치

| 모듈 | 위치 |
|------|------|
| 도메인 특정 코드 | `domain/{feature}/entity/` (엔티티와 함께) |
| 도메인 간 공유 | `domain/common/codes/` |
| 공통 모듈 코드 | `common/codes/` |

## REST Docs 연동

`CommonCodeDocsTest`는 `CommonCode`를 구현한 Enum을 자동으로 문서화한다. 이 테스트는 모든 `code`와 `description` 쌍을 나열하는 REST Docs 스니펫을 생성하여 API 문서를 코드베이스와 동기화한다.
