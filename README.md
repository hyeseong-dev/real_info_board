# COSMIC PULSE

실제 태양풍 속도와 관측 맥락을 매일 기록하고, 데이터가 오지 않을 때도 마지막 정상값을 보존하는 정보판입니다.

## Local development

```bash
npm install
copy .env.example .env.local
npm run dev
```

기본 개발 저장소는 `.data/cosmic-pulse.db`의 SQLite입니다. Vercel 배포에서는 함수 로컬 파일을 영구 저장소로 사용하지 않으며, 배포 전에 외부 SQLite 또는 Supabase 어댑터를 선택합니다.

Vercel에서 Supabase를 사용할 때는 [supabase/schema.sql](./supabase/schema.sql)을 적용한 뒤 `DATABASE_PROVIDER=supabase`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`를 서버 환경변수로 설정합니다. 이전 service-role JWT는 `SUPABASE_SERVICE_ROLE_KEY`로도 사용할 수 있습니다. 비밀 키는 브라우저 코드나 `NEXT_PUBLIC_*` 변수에 넣지 않습니다.

## Checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Data contract

NOAA SWPC의 `rtsw_wind_1m.json`에서 `active=true`인 최신 행의 `proton_speed`를 사용합니다. NOAA는 `source`를 위성 식별자, `active`를 당시 운용 자료 여부로 정의하며, 태양풍 속도 단위는 `km/s`입니다. 원천 시각 원문과 UTC 정규화값, 실제 응답 수신 시각, 원자료 SHA-256을 함께 보존합니다.

- [NOAA Solar Wind 제품 설명](https://www.spaceweather.gov/products/solar-wind)
- [NOAA/NWS Service Change Notice 26-21](https://www.weather.gov/media/notification/pdf_2026/scn26-21_Data_Format_Changes_Impacting_SWPC_Products.pdf)
- [사용 중인 공개 JSON](https://services.swpc.noaa.gov/json/rtsw/rtsw_wind_1m.json)

기준과 설계는 [constitution.txt](./constitution.txt)와 [PROJECT_PREFLIGHT_REVIEW.md](./PROJECT_PREFLIGHT_REVIEW.md)를 참고하세요. `constitution.txt` 원문은 변경하지 않습니다.

## Current status

로컬 MVP가 동작합니다.

- `/`: 실제 NOAA 태양풍 조회, KST 일별 SQLite upsert, 마지막 두 기록 비교
- `/evidence`: 서로 다른 실제 KST 날짜의 첫 정상 수집본을 해시와 함께 최대 2건 고정
- `/lab`: 다섯 개발용 합성 실패와 다음 날짜 복구 재생
- 실제 원천 실패 시 마지막 정상값과 원래 시각 보존

`DEV-*` fixture는 개발용이며 공식 과제 자산이 아닙니다. 현재 실제 KST 날짜 1건을 로컬 증거 저장소에 확보했으며, 두 번째 실제 날짜와 공식 시험 자산은 아직 필요합니다.
