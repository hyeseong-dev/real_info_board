# COSMIC PULSE

실제 태양풍 속도와 관측 맥락을 매일 기록하고, 데이터가 오지 않을 때도 마지막 정상값을 보존하는 정보판입니다.

## Local development

```bash
npm install
copy .env.example .env.local
npm run dev
```

기본 개발 저장소는 `.data/cosmic-pulse.db`의 SQLite입니다. Vercel 배포에서는 함수 로컬 파일을 영구 저장소로 사용하지 않으며, 배포 전에 외부 SQLite 또는 Supabase 어댑터를 선택합니다.

## Checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

기준과 설계는 [constitution.txt](./constitution.txt)와 [PROJECT_PREFLIGHT_REVIEW.md](./PROJECT_PREFLIGHT_REVIEW.md)를 참고하세요. `constitution.txt` 원문은 변경하지 않습니다.

## Current status

로컬 MVP가 동작합니다.

- `/`: 실제 NOAA 태양풍 조회, KST 일별 SQLite upsert, 마지막 두 기록 비교
- `/lab`: 다섯 개발용 합성 실패와 다음 날짜 복구 재생
- 실제 원천 실패 시 마지막 정상값과 원래 시각 보존

`DEV-*` fixture는 개발용이며 공식 과제 자산이 아닙니다. 공식 시험 자산과 서로 다른 실제 KST 날짜의 제출 증거는 아직 확보되지 않았습니다.
