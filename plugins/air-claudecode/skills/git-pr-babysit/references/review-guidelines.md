# PR Review Guidelines

## Focus Areas

### Security
- OWASP Top 10 (SQL injection, XSS, command injection)
- 하드코딩된 credentials / secrets
- 입력값 검증 누락

### Performance
- N+1 쿼리
- 불필요한 메모리 할당 / 리소스 누수
- 인덱스 누락 가능성

### Code Quality
- KISS, DRY, YAGNI 원칙
- 적절한 에러 핸들링
- 일관된 추상화 레벨

### Business Logic
- 비즈니스 로직 정합성
- 엣지 케이스 처리

## Severity Levels

| Level | Meaning | Action |
|-------|---------|--------|
| P0 (Critical) | 보안 취약점, 버그, 데이터 손실 위험 | 머지 전 반드시 수정 |
| P1 (Major) | 성능 이슈, 검증 누락 | 수정 권장 |
| P2 (Minor) | 네이밍, 가독성, 리팩토링 | 고려 |
| NIT | 스타일 선호 | 선택 |

## Custom Rules

- (팀별 추가 지침을 여기에 작성하세요)
