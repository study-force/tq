import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "../../../../../lib/admin-auth";
import { getSupabaseTq, isTqEnabled } from "../../../../../lib/supabase-tq";

// PUT /api/admin/tq-rules/[id] — 규칙 수정 (tag/message/conditions/enabled)
export async function PUT(request, { params }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }
  if (!isTqEnabled()) {
    return NextResponse.json({ error: "TQ_SUPABASE 환경변수 미설정" }, { status: 500 });
  }
  try {
    const { id } = await params;
    const ridNum = Number(id);
    if (!Number.isFinite(ridNum)) {
      return NextResponse.json({ error: "잘못된 id" }, { status: 400 });
    }
    const body = await request.json();
    const upd = {};
    if (body.tag !== undefined)        upd.tag = body.tag;
    if (body.message !== undefined)    upd.message = body.message;
    if (body.conditions !== undefined) upd.conditions = body.conditions;
    if (body.enabled !== undefined)    upd.enabled = !!body.enabled;
    if (Object.keys(upd).length === 0) {
      return NextResponse.json({ error: "변경 항목 없음" }, { status: 400 });
    }
    const sb = getSupabaseTq();
    const { data, error } = await sb
      .from("tq_rules")
      .update(upd)
      .eq("id", ridNum)
      .select();
    if (error) throw error;
    return NextResponse.json({ rule: data?.[0] || null });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/admin/tq-rules/[id] — 규칙 삭제
export async function DELETE(_request, { params }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }
  if (!isTqEnabled()) {
    return NextResponse.json({ error: "TQ_SUPABASE 환경변수 미설정" }, { status: 500 });
  }
  try {
    const { id } = await params;
    const ridNum = Number(id);
    if (!Number.isFinite(ridNum)) {
      return NextResponse.json({ error: "잘못된 id" }, { status: 400 });
    }
    const sb = getSupabaseTq();
    const { error } = await sb.from("tq_rules").delete().eq("id", ridNum);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
