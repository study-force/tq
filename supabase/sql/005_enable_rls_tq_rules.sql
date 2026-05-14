-- 2단계: tq_rules RLS 활성화
-- ⚠️ 주의: 실행 시점에 tq_admin_rules.html (anon key 직접 접근) 동작 중단됨
-- 사전 작업: tq_admin_rules.html → 서버 API 경유로 마이그레이션 권장

ALTER TABLE public.tq_rules ENABLE ROW LEVEL SECURITY;
