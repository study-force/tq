import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "../../../../lib/admin-auth";
import { getSupabaseTq, isTqEnabled } from "../../../../lib/supabase-tq";

// GET /api/admin/tq-rules — 전체 규칙 목록
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }
  if (!isTqEnabled()) {
    return NextResponse.json({ enabled: false, error: "TQ_SUPABASE 환경변수 미설정" }, { status: 200 });
  }
  try {
    const sb = getSupabaseTq();
    const { data, error } = await sb
      .from("tq_rules")
      .select("*")
      .order("area")
      .order("sort_order");
    if (error) throw error;
    return NextResponse.json({ enabled: true, rules: data || [] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/admin/tq-rules — 새 규칙 추가
export async function POST(request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }
  if (!isTqEnabled()) {
    return NextResponse.json({ error: "TQ_SUPABASE 환경변수 미설정" }, { status: 500 });
  }
  try {
    const body = await request.json();
    const { area, area_name, rule_id, tag, message, conditions, sort_order, enabled } = body || {};
    if (!area || !rule_id || !message) {
      return NextResponse.json({ error: "area, rule_id, message는 필수" }, { status: 400 });
    }
    const sb = getSupabaseTq();
    const { data, error } = await sb
      .from("tq_rules")
      .insert({
        area,
        area_name: area_name || "",
        rule_id,
        tag: tag || "보통",
        message,
        conditions: conditions || {},
        sort_order: sort_order || 1,
        enabled: enabled !== false,
      })
      .select();
    if (error) throw error;
    return NextResponse.json({ rule: data?.[0] || null });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
