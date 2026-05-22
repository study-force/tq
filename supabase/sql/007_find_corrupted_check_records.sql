-- 손상 레코드 식별 — tq_habits / tq_eff_checks 가 전부 checked=false 인 result_id 찾기
--
-- 원인:
--   tq-engine save 액션이 reading_habit_checks/reading_effect_checks를 문자열 배열로 가정하고
--   `.includes(item)`으로 매칭함. 외부 tqdata(?tqdata=...)는 boolean 배열로 전송하기 때문에
--   매칭이 항상 실패하여 한 result_id의 10개 체크 항목 모두 checked=false 로 저장됨.
-- 증상:
--   - 재로드 시 잘못된습관/결함증상 0개로 표시
--   - hab_score/eff_score 가 max(0, round((1-0/10)*10)*10) = 100 으로 계산
--   - tq_scores.hab_score=100 AND tq_scores.eff_score=100 강한 신호
-- 수정 커밋: 3a7e1d4 (dev), Edge Function 재배포 후 신규 저장은 정상
-- 본 SQL은 식별용 — 복구는 원본 boolean 배열을 외부에서 재전송해야 가능 (DB만으로는 불가)

-- ════════════════════════════════════════════════════════════
-- ① 의심 레코드 목록
--    두 체크 그룹 모두 0개. 진성(실제 체크 없음) 학생도 포함될 수 있으므로
--    아래 ②/④의 분포·점수를 함께 보고 판단.
-- ════════════════════════════════════════════════════════════
SELECT
  r.id   AS result_id,
  r.name,
  r.user_school_grade,
  r.reg_date,
  r.created_at,
  r.academy_token,
  sc.acc,
  sc.hab_score,
  sc.eff_score,
  sc.voca_score,
  sc.wm_score,
  (SELECT COUNT(*) FROM tq_habits     h WHERE h.result_id = r.id AND h.checked) AS hab_checked_count,
  (SELECT COUNT(*) FROM tq_eff_checks e WHERE e.result_id = r.id AND e.checked) AS eff_checked_count
FROM tq_results r
LEFT JOIN tq_scores sc ON sc.result_id = r.id
WHERE
  (SELECT COUNT(*) FROM tq_habits     h WHERE h.result_id = r.id AND h.checked) = 0
  AND (SELECT COUNT(*) FROM tq_eff_checks e WHERE e.result_id = r.id AND e.checked) = 0
ORDER BY r.created_at DESC;

-- ════════════════════════════════════════════════════════════
-- ② academy_token / 일자별 분포 — 외부 통합 진입 패턴 식별
-- ════════════════════════════════════════════════════════════
SELECT
  r.academy_token,
  COUNT(*)                                                  AS suspect_count,
  MIN(r.created_at)::date                                   AS first_seen,
  MAX(r.created_at)::date                                   AS last_seen
FROM tq_results r
WHERE
  (SELECT COUNT(*) FROM tq_habits     h WHERE h.result_id = r.id AND h.checked) = 0
  AND (SELECT COUNT(*) FROM tq_eff_checks e WHERE e.result_id = r.id AND e.checked) = 0
GROUP BY r.academy_token
ORDER BY suspect_count DESC;

-- ════════════════════════════════════════════════════════════
-- ③ 전체 분포 — 의심 레코드 비율 파악
-- ════════════════════════════════════════════════════════════
SELECT
  COUNT(*) AS total_results,
  COUNT(*) FILTER (WHERE
    (SELECT COUNT(*) FROM tq_habits     h WHERE h.result_id = r.id AND h.checked) = 0
    AND (SELECT COUNT(*) FROM tq_eff_checks e WHERE e.result_id = r.id AND e.checked) = 0
  ) AS both_zero,
  COUNT(*) FILTER (WHERE
    (SELECT COUNT(*) FROM tq_habits     h WHERE h.result_id = r.id AND h.checked) = 0
  ) AS hab_zero_only,
  COUNT(*) FILTER (WHERE
    (SELECT COUNT(*) FROM tq_eff_checks e WHERE e.result_id = r.id AND e.checked) = 0
  ) AS eff_zero_only
FROM tq_results r;

-- ════════════════════════════════════════════════════════════
-- ④ 진성-의심 분리 (강신호) — 체크 0인데 다른 지표가 낮은 학생
--    체크가 진짜로 없는 학생은 acc/voca/wm 도 대체로 좋음.
--    아래 조건은 "체크 0인데 정확도/어휘/WM 중 하나라도 60 미만" = 손상 의심 강함
-- ════════════════════════════════════════════════════════════
SELECT
  r.id   AS result_id,
  r.name,
  r.user_school_grade,
  r.reg_date,
  r.created_at,
  r.academy_token,
  sc.acc,
  sc.hab_score,
  sc.eff_score,
  sc.voca_score,
  sc.wm_score
FROM tq_results r
JOIN tq_scores sc ON sc.result_id = r.id
WHERE
  (SELECT COUNT(*) FROM tq_habits     h WHERE h.result_id = r.id AND h.checked) = 0
  AND (SELECT COUNT(*) FROM tq_eff_checks e WHERE e.result_id = r.id AND e.checked) = 0
  AND (sc.acc < 60 OR sc.voca_score < 60 OR sc.wm_score < 60)
ORDER BY r.created_at DESC;

-- ════════════════════════════════════════════════════════════
-- ⑤ (선택) 특정 학생만 빠르게 조회
-- ════════════════════════════════════════════════════════════
-- SELECT r.id, r.name, r.reg_date, r.created_at,
--        (SELECT COUNT(*) FROM tq_habits     h WHERE h.result_id = r.id AND h.checked) AS hab_checked,
--        (SELECT COUNT(*) FROM tq_eff_checks e WHERE e.result_id = r.id AND e.checked) AS eff_checked
-- FROM tq_results r
-- WHERE r.name = '김태연'
-- ORDER BY r.created_at DESC;
