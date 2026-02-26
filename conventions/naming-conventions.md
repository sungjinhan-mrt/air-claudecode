# 네이밍 규칙

## 일반 규칙

| 대상 | 표기법 | 예시 |
|------|--------|------|
| 클래스/인터페이스 | `PascalCase` | `UserService`, `OrderRepository` |
| 함수/메서드 | `camelCase` (동사) | `findUserById()`, `calculateTotal()` |
| 변수 | `camelCase` | `userName`, `orderCount` |
| 상수 | `SCREAMING_SNAKE_CASE` | `MAX_RETRY_COUNT`, `DEFAULT_TIMEOUT` |
| 패키지 | `lowercase`, 언더스코어 없음 | `{projectGroup}.domain.order` |
| 불리언 | 의문형 | `isValid`, `hasPermission`, `canExecute` |
| 약어(2글자) | 모두 대문자 | `IOStream`, `ID` |
| 약어(3글자 이상) | 첫 글자만 대문자 | `XmlParser`, `HttpClient` |

## 계층별 클래스

| 계층 | 패턴 | 예시 |
|------|------|------|
| 외부 컨트롤러 | `{Feature}ExternalController` | `OrderExternalController` |
| 어드민 컨트롤러 | `{Feature}AdminController` | `OrderAdminController` |
| UseCase | `{Action}{Feature}UseCase` | `CreateOrderUseCase` |
| 응용 서비스 | `{Feature}Service` | `OrderService` |
| 도메인 정책 | `{Feature}{Rule}Policy` | `OrderLimitPolicy` |
| 도메인 서비스 | `{Concept}Service` | `DiscountService` |
| JPA 엔티티 | `{Feature}JpaEntity` | `OrderJpaEntity` |
| JPA 리포지토리 | `{Feature}JpaRepository` | `OrderJpaRepository` |
| 쿼리 리포지토리 | `{Feature}QueryRepository` | `OrderQueryRepository` |
| Mapper | `{Feature}Mapper` | `OrderMapper` |

## DTO

| 유형 | 패턴 | 패키지 |
|------|------|--------|
| 표현 계층 요청 | `{Feature}{Action}Request` | `presentation/{scope}/request/` |
| 표현 계층 응답 | `{Feature}Response` | `presentation/{scope}/response/` |
| 응용 계층 커맨드 | `{Action}{Feature}Command` | `application/dto/command/` |
| 응용 계층 결과 | `{Feature}Result` | `application/dto/result/` |
| 검색 조건 | `{Feature}SearchCondition` | `application/dto/command/` |

## 엔티티와 도메인

| 대상 | 패턴 | 예시 |
|------|------|------|
| 도메인 모델 | `{Feature}` (명사) | `Order`, `User`, `Payment` |
| JPA 엔티티 | `{Feature}JpaEntity` | `OrderJpaEntity`, `UserJpaEntity` |
| 테이블명 | `snake_case`, 복수형 | `orders`, `users`, `payment_methods` |
| 컬럼명 | `snake_case` | `created_at`, `order_status` |
| Enum 클래스 | `PascalCase` | `OrderStatus`, `PaymentMethod` |
| Enum 상수 | `SCREAMING_SNAKE_CASE` | `PENDING`, `IN_PROGRESS` |

## DateTime 필드

| 타입 | 접미사 | 예시 |
|------|--------|------|
| `LocalDate` | `Date` | `startDate`, `birthDate` |
| `LocalTime` | `Time` | `departureTime`, `checkInTime` |
| `LocalDateTime` | `At` | `createdAt`, `expiredAt` |
| `ZonedDateTime` | `AtZoned` | `scheduledAtZoned`, `publishedAtZoned` |

## 예외

| 대상 | 패턴 | 예시 |
|------|------|------|
| 에러 Enum | `{Feature}Error` | `OrderError`, `PaymentError` |
| 기본 예외 | `{Feature}Exception` | `OrderException` |
| 미존재 | `{Feature}NotFoundException` | `OrderNotFoundException` |
| 이미 존재 | `{Feature}AlreadyExistsException` | `UserAlreadyExistsException` |
| 잘못된 상태 | `{Feature}InvalidStateException` | `OrderInvalidStateException` |

## 이벤트

| 대상 | 패턴 | 예시 |
|------|------|------|
| 이벤트 클래스 | `{Feature}{Action}Event` | `OrderCreatedEvent`, `OrderCancelledEvent` |
| 이벤트 리스너 | `{Feature}EventListener` | `OrderEventListener` |
| 이벤트 패키지 | `domain/event/` | `domain/event/` |
| 리스너 패키지 | `infrastructure/event/` | `infrastructure/event/` |

## QueryDSL 메서드

| 유형 | 접두사 | 예시 |
|------|--------|------|
| 단건 조회 | `fetch` | `fetchById`, `fetchByCode` |
| 목록 조회 | `fetchAll` | `fetchAllByUserId` |
| 페이징 조회 | `fetchPage` | `fetchPageByStatus` |
| 건수 조회 | `fetchCount` | `fetchCountByStatus` |
| 존재 여부 | `exists` | `existsByEmail` |

## URL

| 규칙 | 예시 |
|------|------|
| 기본 경로 | `/api/v1/` |
| **kebab-case** 세그먼트 | `/api/v1/order-items` |
| **복수 명사** | `/api/v1/users`, `/api/v1/orders` |
| 비CRUD 동작 | `POST /api/v1/orders/{id}/cancel` |
| 최대 3단계 중첩 | `/api/v1/users/{id}/orders` |

## Git

| 대상 | 패턴 | 예시 |
|------|------|------|
| 브랜치 | `{type}/{description}` | `feature/PROJ-123-add-login` |
| 커밋 | `{type}({scope}): {description}` | `feat(order): add cancel endpoint` |

## 테스트 메서드

| 규칙 | 예시 |
|------|------|
| 행위 패턴 | `` `should calculate discount when gold member` `` |
| 메서드 패턴 | `` `findById - existing user - returns user` `` |
| REST Docs (명확한 영어) | `` `get holidays by year` `` |

## 안티패턴

- 축약어: `usr`, `ord`, `calc` → 전체 단어를 사용한다
- 헝가리안 표기법: `strName`, `intCount` → 불필요하다
- 범용 이름: `data`, `info`, `manager`, `handler` (기능 접두사 없이 단독 사용)
- 일관성 없는 표기: Kotlin 코드에서 `userId`와 `user_id` 혼용
- `Impl` 접미사: `UserServiceImpl` → UseCase와 Service는 구상 클래스이므로 인터페이스가 불필요하다
