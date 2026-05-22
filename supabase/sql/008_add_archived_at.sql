-- tq_results에 archived_at 컬럼 추가 — 손상 레코드 soft-delete 처리
--
-- 배경:
--   외부 tqdata가 boolean 배열로 들어오는데 save 액션이 .includes()로 매칭 실패하여
--   한 result의 tq_habits / tq_eff_checks가 전부 checked=false 로 저장된 버그가 있었음.
--   Edge Function은 c718e3e 커밋으로 이미 수정 완료 (앞으로의 신규 저장은 정상).
--
-- 손상 레코드 복구 방법:
--   1. 어드민이 응시 페이지(?admin=1)에서 [데이터 삭제] 클릭
--   2. archive 액션이 archived_at = NOW() 세팅
--   3. 학원 시스템에서 결과판독 버튼 재클릭
--   4. load 액션이 archived 행은 무시 → not found → 엔진 실행 → 정상 save (새 행)
--
-- 컬럼 추가
ALTER TABLE tq_results ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- archived 행 빠른 조회용 부분 인덱스
CREATE INDEX IF NOT EXISTS idx_tq_results_archived_at
  ON tq_results (archived_at)
  WHERE archived_at IS NOT NULL;

-- 확인
SELECT
  COUNT(*) FILTER (WHERE archived_at IS NULL)     AS active,
  COUNT(*) FILTER (WHERE archived_at IS NOT NULL) AS archived,
  COUNT(*)                                        AS total
FROM tq_results;
