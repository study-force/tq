-- tq_scores의 NULL acc/hab_score/eff_score 백필
-- 원인: 외부 URL(?tqdata=...) 진입 시 파생값이 inp에 안 실려 그대로 NULL 저장됨
-- 계산식:
--   acc       = round((fact_score + structure_score) / 2 / 10) * 10
--   hab_score = max(0, round((1 - checked/10) * 10) * 10)   ← tq_habits에서 checked 카운트
--   eff_score = max(0, round((1 - checked/10) * 10) * 10)   ← tq_eff_checks에서 checked 카운트

-- ① 백필 대상 미리 보기
SELECT s.id AS score_id, s.result_id, s.acc, s.fact_score, s.structure_score,
       s.hab_score, s.eff_score,
       (SELECT COUNT(*) FROM tq_habits     h WHERE h.result_id = s.result_id AND h.checked) AS hab_checked,
       (SELECT COUNT(*) FROM tq_eff_checks e WHERE e.result_id = s.result_id AND e.checked) AS eff_checked
FROM tq_scores s
WHERE s.acc IS NULL OR s.hab_score IS NULL OR s.eff_score IS NULL
ORDER BY s.id;

-- ② 실제 업데이트 (위 미리 보기 확인 후 실행)
UPDATE tq_scores s
SET
  acc = COALESCE(s.acc,
                 CASE WHEN s.fact_score IS NOT NULL AND s.structure_score IS NOT NULL
                      THEN ROUND((s.fact_score + s.structure_score) / 2.0 / 10) * 10
                      ELSE NULL END),
  hab_score = COALESCE(s.hab_score,
                       GREATEST(0,
                         ROUND((1 - COALESCE(
                           (SELECT COUNT(*) FROM tq_habits h WHERE h.result_id = s.result_id AND h.checked)::numeric / 10
                         , 0)) * 10) * 10
                       )::int),
  eff_score = COALESCE(s.eff_score,
                       GREATEST(0,
                         ROUND((1 - COALESCE(
                           (SELECT COUNT(*) FROM tq_eff_checks e WHERE e.result_id = s.result_id AND e.checked)::numeric / 10
                         , 0)) * 10) * 10
                       )::int)
WHERE s.acc IS NULL OR s.hab_score IS NULL OR s.eff_score IS NULL;

-- ③ 결과 확인
SELECT
  COUNT(*) FILTER (WHERE acc IS NULL)       AS null_acc,
  COUNT(*) FILTER (WHERE hab_score IS NULL) AS null_hab,
  COUNT(*) FILTER (WHERE eff_score IS NULL) AS null_eff,
  COUNT(*)                                  AS total
FROM tq_scores;
