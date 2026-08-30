# 실행 방법

DB → 백엔드 → 앱 순서로 띄웁니다.

## 사전 준비

| 도구 | 용도 | 비고 |
| --- | --- | --- |
| Docker | MariaDB 실행 | 필수 |
| JDK 21 | 백엔드 빌드·실행 | 없으면 아래 "JDK 없이 실행" 참고 |
| Node 20+ | Expo 앱 | |

## 1. 데이터베이스

`db/v2/01_schema.sql`과 `02_seed.sql`이 컨테이너 최초 기동 시 자동으로 적재됩니다.

```bash
docker compose up -d
```

- 접속: `localhost:3307` / DB `gymkkong_v2` / 계정 `gymkkong` / 비밀번호 `gymkkong`
- 초기화하고 다시 넣으려면 볼륨까지 지웁니다:

```bash
docker compose down -v && docker compose up -d
```

## 2. 백엔드 (Spring Boot)

```bash
cd backend && ./gradlew bootRun
```

- 기본 포트 **8090** (8080은 다른 서비스가, 8081은 Expo Metro가 흔히 점유하므로 피했습니다)
- Swagger UI: http://localhost:8090/swagger-ui.html
- 환경변수로 덮어쓸 수 있습니다: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `SERVER_PORT`, `JWT_SECRET`

> `JWT_SECRET`은 운영에서 반드시 교체하세요. HS256이라 32바이트 이상이어야 합니다.

### JDK 없이 실행

로컬에 JDK가 없다면 컨테이너에서 빌드·실행할 수 있습니다.

```bash
docker run --rm -v "$PWD/backend:/app" -w /app gradle:8.12-jdk21 gradle bootJar
```

```bash
docker run -d --name gymkkong-api -p 8090:8090 -v "$PWD/backend/build/libs:/libs:ro" -e SERVER_PORT=8090 -e "DB_URL=jdbc:mariadb://host.docker.internal:3307/gymkkong_v2" --add-host=host.docker.internal:host-gateway eclipse-temurin:21-jre java -jar /libs/gymkkong-api-0.1.0.jar
```

## 3. 앱 (Expo)

```bash
cd app && npx expo start
```

- Expo Go 앱으로 QR을 찍거나, 터미널에서 `a`(Android) / `i`(iOS)를 누릅니다.
- API 주소는 자동으로 정해집니다.
  - **실기기**: Expo가 알려주는 개발 PC의 LAN IP + `:8090`
  - **Android 에뮬레이터**: `10.0.2.2:8090`
  - **직접 지정**: `app/app.json`의 `extra.apiBaseUrl`에 전체 URL을 넣으면 그 값이 우선합니다.

> 실기기에서 연결이 안 되면 PC 방화벽이 8090을 막고 있는지 확인하세요.
> 휴대폰과 PC가 같은 Wi‑Fi에 있어야 합니다.

## 4. 테스트 계정

시드 데이터의 모든 계정 비밀번호는 `gymkkong1234`입니다.

| 역할 | 이메일 | 비고 |
| --- | --- | --- |
| 회원 | `kim@example.com` | 그룹 10회권 보유(잔여 8회), 예약·출석 이력 있음 |
| 회원 | `lee@example.com` | 20회권 + PT 10회권 보유 |
| 회원 | `yoon@example.com` | 환불 완료 이용권 보유(재환불 거부 확인용) |
| 트레이너 | `choi.trainer@gymkkong.com` | 강남점 승인 완료, 잠실점 승인 대기 |
| 트레이너 | `han.teacher@gymkkong.com` | 홍대점 소속 |
| 지점 관리자 | `admin.gangnam@gymkkong.com` | 강남점 담당 |
| 최고 관리자 | `super@gymkkong.com` | 전 지점 |

강습 회차는 `CURDATE()` 기준 상대 날짜로 생성되므로 **언제 실행해도 예정 수업이 보입니다**.

## 5. 검증

### API 스모크 테스트 (16개 항목)

백엔드가 떠 있는 상태에서 서버 단 핵심 플로우를 확인합니다.

```bash
cd backend/scripts && bash smoke-test.sh
```

예약 → 이용권 차감 → 중복 예약 거부 → 취소 → 이용권 복원, 역할별 권한 분리,
재환불 차단까지 검사합니다.

### E2E (28개 시나리오)

Expo 웹으로 띄운 앱을 Playwright가 실제 브라우저에서 주행합니다.
**DB·백엔드·Metro가 모두 떠 있어야 합니다.**

```bash
cd app && npx expo start --web --port 8081
```

```bash
cd app && npx playwright test
```

- 실행 전에 DB를 시드 상태로 되돌리므로 **몇 번을 돌려도 같은 결과**가 나옵니다.
- 주행하면서 `docs/evidence/` 에 화면 캡처를 남깁니다.
- 데이터만 직접 되돌리려면: `bash db/reset-seed.sh`

### 증적 · 화면정의서

```bash
node tools/capture-console.mjs
```

스키마 검증·스모크 테스트·타입 검사·빌드·E2E를 **실제로 다시 실행해서**
그 출력을 `docs/evidence/console/` 에 이미지와 텍스트로 남깁니다.
(`--quick` 은 빌드·E2E 제외, `--render-only` 는 지난 출력으로 이미지만 다시 그림)

```bash
node tools/build-spec.mjs
```

캡처를 모아 화면정의서를 만듭니다. 산출물:

| 파일 | 용도 |
| --- | --- |
| `docs/화면정의서.pdf` | 1920×1080 슬라이드 22장 |
| `docs/spec-slides/S01~S21.png` | 장당 이미지 |
| `docs/화면정의서.html` | 브라우저로 바로 보기 (이미지 내장) |

내용을 고치려면 `tools/spec-data.mjs` 를 수정하고 다시 실행하면 됩니다.

### Figma Slides

같은 내용을 Figma Slides로도 만들어 두었습니다. 22장, 4개 섹션(들어가며 / 회원 /
트레이너·관리자 / 증적·마무리)이며 캡처 44장이 실제 이미지로 들어가 있습니다.

- https://www.figma.com/slides/qieUXv3DkmEcmfcyaAb9B8

편집이 필요하면 Figma에서 바로 고치면 됩니다. 캡처를 갱신할 때는 E2E를 다시 돌린 뒤
해당 이미지 노드에 새 파일을 올리면 됩니다.

## 6. 증적

E2E 한 번 실행으로 아래가 함께 나옵니다.

| 종류 | 위치 | 수량 |
| --- | --- | --- |
| 화면 캡처 | `docs/evidence/*.png` | 46장 |
| 시나리오 녹화 | `docs/evidence/video/*.webm` · `*.mp4` | 28건 × 2 포맷 |
| 콘솔 출력 | `docs/evidence/console/*.png` · `*.txt` | 8건 |

녹화 목록은 `docs/evidence/video/INDEX.md` 에 시나리오 이름과 함께 정리됩니다.
영상 파일은 용량이 커서 저장소에는 넣지 않고 목록만 남깁니다 — 필요하면
`npx playwright test` 로 다시 만들 수 있습니다.

## 7. 설계 문서

| 문서 | 내용 |
| --- | --- |
| [architecture.md](architecture.md) | 전체 구성, 레이어, 앱 구조, 시퀀스 플로우, 동시성 설계 |
| [rbac.md](rbac.md) | 역할 정의, 권한 매트릭스, 4단 방어, 우회 시도 차단 |
| [erd.md](erd.md) | 스키마 v2 ERD, 제약·인덱스, v1 대응표 |
| [schema-v2.md](schema-v2.md) | v1의 문제와 v2가 그것을 어떻게 고쳤는지 |

다이어그램은 전부 mermaid입니다. 문서를 고친 뒤에는 문법을 확인하세요.

```bash
node tools/check-mermaid.mjs
```

## 자주 겪는 문제

**포트 충돌**
`8090`이 이미 쓰이면 `SERVER_PORT=9090 ./gradlew bootRun`처럼 바꾸고,
`app/app.json`의 `extra.apiBaseUrl`도 같은 포트로 맞춰주세요.

**`Schema-validation` 오류로 백엔드가 안 뜸**
엔티티와 DB 스키마가 어긋난 경우입니다. `docker compose down -v && docker compose up -d`로
스키마를 다시 적재하세요. 애플리케이션은 `ddl-auto: validate`라 스키마를 직접 만들지 않습니다.

**인증번호를 못 받음**
SMS/메일 발송기가 아직 붙어 있지 않습니다. 인증번호는 **백엔드 콘솔 로그**에
`[인증코드] ... code=123456` 형태로 출력됩니다.
