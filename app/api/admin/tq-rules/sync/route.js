import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "../../../../../lib/admin-auth";
import { getSupabaseTq, getSupabaseTqProd, isTqEnabled, isTqProdEnabled } from "../../../../../lib/supabase-tq";

// POST /api/admin/tq-rules/sync — 현재 환경 DB의 전체 규칙을 PROD에 upsert
// (현재 환경이 PROD 자체일 수도 있는데 그 경우 자기 자신에게 upsert. 무해)
export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }
  if (!isTqEnabled() || !isTqProdEnabled()) {
    return NextResponse.json({ error: "TQ 환경변수 미설정 (TQ_SUPABASE_*, TQ_PROD_SUPABASE_*)" }, { status: 500 });
  }
  try {
    const sb = getSupabaseTq();
    const { data: rules, error: fetchErr } = await sb
      .from("tq_rules")
      .select("*")
      .order("id");
    if (fetchErr) throw fetchErr;
    if (!rules || rules.length === 0) {
      return NextResponse.json({ error: "동기화할 규칙 없음" }, { status: 400 });
    }
    const sbProd = getSupabaseTqProd();
    const { error: upsertErr } = await sbProd
      .from("tq_rules")
      .upsert(rules, { onConflict: "rule_id" });
    if (upsertErr) throw upsertErr;
    return NextResponse.json({ ok: true, count: rules.length });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
