-- Supabase Security Advisor: "RLS Disabled in Public" 해결 (1단계 — 안전)
-- 대상: Edge Function(service_role)만 접근하는 7개 테이블
-- service_role은 RLS를 자동 우회하므로 정책 없이 RLS만 켜도 동작에 영향 없음
-- 적용: tq-engine-dev → 검증 후 → tq-engine(PROD)

ALTER TABLE public.academies     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tq_results    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tq_scores     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tq_habits     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tq_eff_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tq_engine     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tq_slots      ENABLE ROW LEVEL SECURITY;

-- (tq_rules는 별도 단계에서 처리 — tq_admin_rules.html anon 접근 영향)

-- 결과 확인용
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('academies','tq_results','tq_scores','tq_habits',
                    'tq_eff_checks','tq_engine','tq_slots','tq_rules')
ORDER BY tablename;
