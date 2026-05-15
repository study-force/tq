"use client";
import React, { useEffect, useState, useMemo, useRef } from "react";
import { AREAS, TAG_LIST, COND_COLS, COND_KEY_SET } from "./constants";
import { BoundaryView, LogicView, VariablesView } from "./reference-views";

// ── 유틸 ──
function getCondVal(conditions, key) {
  if (!conditions) return undefined;
  const parts = key.split(".");
  let v = conditions;
  for (const p of parts) {
    if (v == null) return undefined;
    v = v[p];
  }
  return v;
}
function setCondVal(conditions, key, value) {
  const parts = key.split(".");
  let obj = conditions;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!obj[parts[i]] || typeof obj[parts[i]] !== "object") obj[parts[i]] = {};
    obj = obj[parts[i]];
  }
  if (value === "" || value === "-" || value === undefined) {
    delete obj[parts[parts.length - 1]];
    if (parts.length > 1 && Object.keys(obj).length === 0) delete conditions[parts[0]];
  } else {
    if (value === "true") obj[parts[parts.length - 1]] = true;
    else if (value === "false") obj[parts[parts.length - 1]] = false;
    else obj[parts[parts.length - 1]] = value;
  }
}
function getEtcConditions(conditions) {
  if (!conditions) return {};
  const etc = {};
  for (const k of Object.keys(conditions)) {
    const baseK = k.replace(/_max$/, "");
    const isKnown = COND_COLS.some(c => c.key === k || c.key === baseK || c.key.startsWith(k + "."));
    if (!isKnown) etc[k] = conditions[k];
  }
  return etc;
}
function condBadgeClass(val, key) {
  if (val === undefined || val === null || val === "") return "empty";
  const v = String(val);
  if (v === "-") return "empty";
  if (key === "flagC" || key === "flagO") {
    if (v === "true") return "bool-true";
    if (v.includes("선행")) return "bool-special";
    return "has";
  }
  if (/^[>≥]=?\s*[89]\d/.test(v) || v === "≥90" || v === "≥80") return "range-high";
  if (/^[7-8]\d[~-]/.test(v) || v === "≥70" || v === "70~89" || v === "빠름") return "range-mid";
  if (/^[5-6]\d[~-]/.test(v) || v === "50~69" || v === "느림" || v === "보통" || v === "경미") return "range-warn";
  if (/^[<≤]\s*[3-5]\d/.test(v) || v === "<50" || v === "30~49") return "range-low";
  if (/^[<≤]\s*[12]\d/.test(v) || v === "<30" || v === "<10" || v === "≤10" || v === "심각" || v === "심함") return "range-danger";
  if (v === "true") return "bool-true";
  return "has";
}
const AREA_CONTRADICTION = "contradiction";

export default function TqRulesAdminPage() {
  const [allRules, setAllRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState(null);
  const [currentArea, setCurrentArea] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [editBuf, setEditBuf] = useState({ conds: {}, tag: "", message: "", etcJson: "" });
  const [toast, setToast] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ rule_id: "", tag: "보통", message: "", conds: {}, etcJson: "{}" });
  const [syncOpen, setSyncOpen] = useState(false);
  const [syncPw, setSyncPw] = useState("");
  const [syncErr, setSyncErr] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);

  const SYNC_PASSWORD = "asdf1234"; // 기존과 동일 (변경 시 양쪽 같이)

  const showToast = (msg, isErr = false) => {
    setToast({ msg, isErr });
    setTimeout(() => setToast(null), 2500);
  };

  const loadRules = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/tq-rules");
      const d = await r.json();
      if (d.enabled === false) { setEnabled(false); setLoading(false); return; }
      if (!r.ok) throw new Error(d.error || "로드 실패");
      setAllRules(d.rules || []);
      setLoading(false);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };
  useEffect(() => { loadRules(); }, []);

  const ruleStats = useMemo(() => {
    const byArea = {};
    AREAS.forEach(a => { byArea[a.id] = allRules.filter(r => r.area === a.id).length; });
    const contradictionCount = allRules.filter(r => {
      const c = r.conditions || {};
      return c.flagC === true || c.flagC === "true" || c.flagO === true || c.flagO === "true";
    }).length;
    return { byArea, contradictionCount };
  }, [allRules]);

  const isContradictionMode = currentArea === AREA_CONTRADICTION;
  const isReferenceTab = ["boundary", "logic", "variables"].includes(currentArea);

  const visibleRules = useMemo(() => {
    if (isContradictionMode) {
      return allRules
        .filter(r => {
          const c = r.conditions || {};
          return c.flagC === true || c.flagC === "true" || c.flagO === true || c.flagO === "true";
        })
        .sort((a, b) => a.area - b.area || a.sort_order - b.sort_order);
    }
    if (typeof currentArea === "number") {
      return allRules.filter(r => r.area === currentArea).sort((a, b) => a.sort_order - b.sort_order);
    }
    return [];
  }, [allRules, currentArea, isContradictionMode]);

  const switchArea = (id) => {
    if (editingId !== null) {
      if (!confirm("편집 중인 내용이 있습니다. 취소하시겠습니까?")) return;
      setEditingId(null);
    }
    setCurrentArea(id);
  };

  // ── 인라인 편집 ──
  const startEdit = (r) => {
    if (editingId !== null && editingId !== r.id) {
      if (!confirm("다른 행 편집 중입니다. 취소하고 이 행을 편집할까요?")) return;
    }
    const conds = {};
    COND_COLS.forEach(c => {
      const v = getCondVal(r.conditions || {}, c.key);
      conds[c.key] = v !== undefined ? String(v) : "";
    });
    const etc = getEtcConditions(r.conditions);
    setEditBuf({ conds, tag: r.tag, message: r.message, etcJson: Object.keys(etc).length ? JSON.stringify(etc) : "" });
    setEditingId(r.id);
  };
  const cancelEdit = () => { setEditingId(null); setEditBuf({ conds: {}, tag: "", message: "", etcJson: "" }); };

  const saveRow = async (r) => {
    const newMsg = (editBuf.message || "").trim();
    if (!newMsg) { showToast("메시지를 입력하세요", true); return; }
    const newConds = {};
    if (editBuf.etcJson && editBuf.etcJson.trim()) {
      try { Object.assign(newConds, JSON.parse(editBuf.etcJson.trim())); }
      catch { showToast("기타 조건 JSON 오류", true); return; }
    } else {
      Object.assign(newConds, getEtcConditions(r.conditions));
    }
    COND_COLS.forEach(c => {
      const v = editBuf.conds[c.key];
      if (v && v !== "" && v !== "-") setCondVal(newConds, c.key, v);
    });
    try {
      const res = await fetch(`/api/admin/tq-rules/${r.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag: editBuf.tag, message: newMsg, conditions: newConds }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "저장 실패");
      setAllRules(prev => prev.map(x => x.id === r.id ? { ...x, tag: editBuf.tag, message: newMsg, conditions: newConds } : x));
      cancelEdit();
      showToast("규칙 저장됨");
    } catch (e) { showToast(e.message, true); }
  };

  const toggleEnabled = async (r, newVal) => {
    try {
      const res = await fetch(`/api/admin/tq-rules/${r.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: newVal }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "토글 실패"); }
      setAllRules(prev => prev.map(x => x.id === r.id ? { ...x, enabled: newVal } : x));
      showToast(newVal ? "활성화됨" : "비활성화됨");
    } catch (e) { showToast(e.message, true); }
  };

  const deleteRule = async (r) => {
    if (!confirm(`규칙 "${r.rule_id}"을(를) 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch(`/api/admin/tq-rules/${r.id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "삭제 실패"); }
      setAllRules(prev => prev.filter(x => x.id !== r.id));
      if (editingId === r.id) cancelEdit();
      showToast("규칙 삭제됨");
    } catch (e) { showToast(e.message, true); }
  };

  // ── 추가 ──
  const openAdd = () => {
    if (isContradictionMode) { showToast("모순패턴 탭에서는 추가할 수 없습니다. 해당 영역에서 추가하세요.", true); return; }
    if (typeof currentArea !== "number") { showToast("규칙 영역을 먼저 선택하세요", true); return; }
    const conds = {};
    COND_COLS.forEach(c => { conds[c.key] = ""; });
    setAddForm({ rule_id: "", tag: "보통", message: "", conds, etcJson: "{}" });
    setAddOpen(true);
  };
  const submitAdd = async () => {
    const ruleId = addForm.rule_id.trim();
    const message = addForm.message.trim();
    if (!ruleId || !message) { showToast("Rule ID와 메시지를 입력하세요", true); return; }
    const conditions = {};
    if (addForm.etcJson && addForm.etcJson.trim() && addForm.etcJson.trim() !== "{}") {
      try { Object.assign(conditions, JSON.parse(addForm.etcJson.trim())); }
      catch { showToast("기타 조건 JSON 오류", true); return; }
    }
    COND_COLS.forEach(c => {
      const v = addForm.conds[c.key];
      if (v && v.trim() && v.trim() !== "-") setCondVal(conditions, c.key, v.trim());
    });
    const existing = allRules.filter(r => r.area === currentArea);
    const maxSort = existing.length > 0 ? Math.max(...existing.map(r => r.sort_order || 0)) : 0;
    const areaName = AREAS.find(a => a.id === currentArea)?.name || "";
    try {
      const res = await fetch("/api/admin/tq-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ area: currentArea, area_name: areaName, rule_id: ruleId, tag: addForm.tag, message, conditions, sort_order: maxSort + 1, enabled: true }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "추가 실패");
      if (d.rule) setAllRules(prev => [...prev, d.rule]);
      setAddOpen(false);
      showToast("규칙 추가됨");
    } catch (e) { showToast(e.message, true); }
  };

  // ── PROD 동기화 ──
  const openSync = () => { setSyncPw(""); setSyncErr(false); setSyncOpen(true); };
  const confirmSync = async () => {
    if (syncPw !== SYNC_PASSWORD) { setSyncErr(true); return; }
    setSyncOpen(false);
    setSyncBusy(true);
    showToast("동기화 중...");
    try {
      const res = await fetch("/api/admin/tq-rules/sync", { method: "POST" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "동기화 실패");
      showToast(`✅ ${d.count}개 규칙이 production에 반영됐습니다`);
    } catch (e) { showToast("동기화 실패: " + e.message, true); }
    finally { setSyncBusy(false); }
  };

  if (loading) return <div style={S.loading}>로딩 중…</div>;
  if (enabled === false) return (
    <div style={{ padding: 40 }}>
      <h1 style={S.h1}>TQ 규칙 관리</h1>
      <div style={S.disabled}>
        <strong>TQ 연결이 설정되지 않았습니다.</strong>
        <div style={{ fontSize: 13, color: "#64748B", marginTop: 8 }}>
          <code>TQ_SUPABASE_URL</code> / <code>TQ_SUPABASE_SERVICE_ROLE_KEY</code> 환경변수 필요.
        </div>
      </div>
    </div>
  );
  if (error) return <div style={{ padding: 40, color: "#991B1B" }}>오류: {error}</div>;

  return (
    <div style={S.layout}>
      {/* Sidebar */}
      <aside style={S.sidebar}>
        <div style={S.sidebarHeader}>
          <h1 style={S.sidebarTitle}><span style={{ color: "#3B82F6" }}>TQ</span> Rules</h1>
        </div>
        <nav style={S.sidebarNav}>
          {AREAS.map(a => (
            <div key={a.id} onClick={() => switchArea(a.id)} style={S.navItem(currentArea === a.id, false, false)}>
              <span>{a.id}) {a.name}</span>
              <span style={S.navCount(currentArea === a.id, false)}>{ruleStats.byArea[a.id] || 0}</span>
            </div>
          ))}
          <div style={S.navDivider} />
          <div onClick={() => switchArea(AREA_CONTRADICTION)} style={S.navItem(isContradictionMode, true, false)}>
            <span>모순패턴 관리</span>
            <span style={S.navCount(isContradictionMode, true)}>{ruleStats.contradictionCount}</span>
          </div>
          <div style={S.navDivider} />
          <div onClick={() => switchArea("boundary")}  style={S.navItem(currentArea === "boundary",  false, true)}>경계값 기준표</div>
          <div onClick={() => switchArea("logic")}     style={S.navItem(currentArea === "logic",     false, true)}>판독 로직 구조</div>
          <div onClick={() => switchArea("variables")} style={S.navItem(currentArea === "variables", false, true)}>변수 약어 목록</div>
        </nav>
      </aside>

      {/* Content */}
      <div style={S.content}>
        <div style={S.main}>
          <div style={S.toolbar}>
            <div style={S.areaTitle}>{getAreaTitle(currentArea, isContradictionMode, visibleRules.length)}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={openSync} style={S.btnSync} disabled={syncBusy}>🔄 Production 동기화</button>
              {!isReferenceTab && !isContradictionMode && (
                <button onClick={openAdd} style={S.btnPrimary}>+ 규칙 추가</button>
              )}
            </div>
          </div>

          {isReferenceTab ? (
            <div style={S.refWrap}>
              {currentArea === "boundary" && <BoundaryView />}
              {currentArea === "logic" && <LogicView />}
              {currentArea === "variables" && <VariablesView />}
            </div>
          ) : visibleRules.length === 0 ? (
            <div style={S.empty}>
              <p>이 영역에 등록된 규칙이 없습니다.</p>
              {!isContradictionMode && <button onClick={openAdd} style={S.btnPrimary}>+ 규칙 추가</button>}
            </div>
          ) : (
            <RulesTable
              rules={visibleRules}
              isContradictionMode={isContradictionMode}
              editingId={editingId}
              editBuf={editBuf}
              setEditBuf={setEditBuf}
              startEdit={startEdit}
              cancelEdit={cancelEdit}
              saveRow={saveRow}
              toggleEnabled={toggleEnabled}
              deleteRule={deleteRule}
            />
          )}
        </div>
      </div>

      {/* Add modal */}
      {addOpen && (
        <div style={S.modalOv} onClick={(e) => e.target === e.currentTarget && setAddOpen(false)}>
          <div style={S.modal}>
            <h3 style={S.modalH3}>규칙 추가 — {currentArea}) {AREAS.find(a => a.id === currentArea)?.name}</h3>
            <label style={S.lbl}>Rule ID</label>
            <input style={S.input} value={addForm.rule_id} onChange={e => setAddForm(f => ({ ...f, rule_id: e.target.value }))} placeholder="예: 1_new_xxx" />
            <label style={S.lbl}>태그</label>
            <select style={S.input} value={addForm.tag} onChange={e => setAddForm(f => ({ ...f, tag: e.target.value }))}>
              {TAG_LIST.map(t => <option key={t}>{t}</option>)}
            </select>
            <label style={S.lbl}>메시지</label>
            <textarea style={{ ...S.input, minHeight: 80 }} value={addForm.message} onChange={e => setAddForm(f => ({ ...f, message: e.target.value }))} />
            <label style={S.lbl}>조건</label>
            <div style={S.condGrid}>
              {COND_COLS.map(c => (
                <div key={c.key}>
                  <div style={S.condLbl}>{c.label}</div>
                  <input style={{ ...S.input, marginBottom: 0, padding: "6px 8px", fontSize: 12 }}
                    value={addForm.conds[c.key] || ""}
                    onChange={e => setAddForm(f => ({ ...f, conds: { ...f.conds, [c.key]: e.target.value } }))}
                    placeholder="-" />
                </div>
              ))}
            </div>
            <label style={S.lbl}>기타 조건 (JSON)</label>
            <textarea style={{ ...S.input, minHeight: 60, fontFamily: "monospace", fontSize: 12 }}
              value={addForm.etcJson} onChange={e => setAddForm(f => ({ ...f, etcJson: e.target.value }))} />
            <div style={S.btnRow}>
              <button style={S.btnGhost} onClick={() => setAddOpen(false)}>취소</button>
              <button style={S.btnPrimary} onClick={submitAdd}>저장</button>
            </div>
          </div>
        </div>
      )}

      {/* Sync modal */}
      {syncOpen && (
        <div style={S.modalOv} onClick={(e) => e.target === e.currentTarget && setSyncOpen(false)}>
          <div style={{ ...S.modal, maxWidth: 400 }}>
            <h3 style={{ ...S.modalH3, color: "#D97706" }}>🔄 Production 동기화</h3>
            <p style={{ fontSize: 13, color: "#64748B", margin: "12px 0", lineHeight: 1.6 }}>
              현재 환경 DB의 <strong>전체 규칙</strong>을 production DB에 반영합니다.<br />
              기존 production 규칙은 <strong style={{ color: "#DC2626" }}>덮어씌워집니다.</strong>
            </p>
            <label style={S.lbl}>확인 비밀번호</label>
            <input style={S.input} type="password" autoFocus value={syncPw}
              onChange={e => { setSyncPw(e.target.value); setSyncErr(false); }}
              onKeyDown={e => e.key === "Enter" && confirmSync()} />
            {syncErr && <div style={{ color: "#DC2626", fontSize: 12, marginTop: 6 }}>비밀번호가 틀렸습니다.</div>}
            <div style={S.btnRow}>
              <button style={S.btnGhost} onClick={() => setSyncOpen(false)}>취소</button>
              <button style={{ ...S.btnPrimary, background: "#F59E0B" }} onClick={confirmSync}>동기화 실행</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ ...S.toast, background: toast.isErr ? "#DC2626" : "#059669" }}>{toast.msg}</div>
      )}
    </div>
  );
}

function getAreaTitle(area, isContradiction, count) {
  if (area === "boundary") return "경계값 기준표";
  if (area === "logic") return "판독 로직 구조";
  if (area === "variables") return "변수 약어 전체 목록";
  if (isContradiction) return `모순패턴 관리 (${count}개 규칙 — flagC 또는 flagO 포함)`;
  const a = AREAS.find(x => x.id === area);
  return `${area}) ${a?.name || ""} (${count}개 규칙)`;
}

// ── 규칙 테이블 컴포넌트 ──
function RulesTable({ rules, isContradictionMode, editingId, editBuf, setEditBuf, startEdit, cancelEdit, saveRow, toggleEnabled, deleteRule }) {
  return (
    <div style={S.dtWrap}>
      <table style={S.dt}>
        <thead>
          <tr>
            <th rowSpan={2} style={{ ...S.th, ...S.thNumStickyL, width: 30 }}>#</th>
            <th rowSpan={2} style={{ ...S.th, ...S.thIdStickyL, width: 100 }}>Rule ID</th>
            <th colSpan={COND_COLS.length + 1} style={{ ...S.th, ...S.grpCond }}>조건</th>
            <th rowSpan={2} style={{ ...S.th, width: 60 }}>태그</th>
            <th rowSpan={2} style={{ ...S.th, minWidth: 200, textAlign: "left" }}>메시지 텍스트</th>
            <th rowSpan={2} style={{ ...S.th, width: 130 }}>액션</th>
          </tr>
          <tr>
            {COND_COLS.map(c => (
              <th key={c.key} style={{ ...S.th, ...S.thRow2, minWidth: c.width }}>{c.label}</th>
            ))}
            <th style={{ ...S.th, ...S.thRow2, minWidth: 60 }}>기타</th>
          </tr>
        </thead>
        <tbody>
          {rules.map((r, i) => {
            const isEd = editingId === r.id;
            const conds = r.conditions || {};
            const rowBg = isEd ? "#FFFBEB" : "#fff";
            return (
              <tr key={r.id} style={{ ...S.tr, ...(isEd ? S.trEditing : {}) }}>
                <td style={{ ...S.td, ...S.tdNumSticky, color: "#475569", fontSize: 11, background: rowBg }}>{i + 1}</td>
                <td style={{ ...S.td, ...S.tdIdSticky, background: rowBg }}>
                  <span style={S.ruleId}>{r.rule_id}</span>
                  {isContradictionMode && <div style={{ fontSize: 10, color: "#94A3B8" }}>{r.area}) {r.area_name}</div>}
                </td>
                {COND_COLS.map(c => {
                  const v = getCondVal(conds, c.key);
                  const maxV = getCondVal(conds, c.key + "_max");
                  if (isEd) {
                    const inputVal = editBuf.conds[c.key] !== undefined ? editBuf.conds[c.key] : (v !== undefined ? String(v) : "");
                    if (c.key === "flagC" || c.key === "flagO") {
                      return (
                        <td key={c.key} style={S.td}>
                          <select style={S.tagSelect} value={inputVal}
                            onChange={e => setEditBuf(b => ({ ...b, conds: { ...b.conds, [c.key]: e.target.value } }))}>
                            <option value="">-</option>
                            <option value="true">true</option>
                            {c.key === "flagC" && <option value="true(선행과부하)">true(선행과부하)</option>}
                          </select>
                        </td>
                      );
                    }
                    return (
                      <td key={c.key} style={S.td}>
                        <input style={S.condInput} value={inputVal}
                          onChange={e => setEditBuf(b => ({ ...b, conds: { ...b.conds, [c.key]: e.target.value } }))}
                          placeholder="-" />
                      </td>
                    );
                  }
                  const displayVal = (maxV && v) ? `${v} ~ ${maxV}` : v;
                  const cls = condBadgeClass(displayVal, c.key);
                  return (
                    <td key={c.key} style={S.td}>
                      {displayVal === undefined || displayVal === null || displayVal === "" || displayVal === "-"
                        ? <span style={{ ...S.condVal, ...S.condEmpty }}>-</span>
                        : <span style={{ ...S.condVal, ...condValStyle(cls) }}>{String(displayVal)}</span>}
                    </td>
                  );
                })}
                {/* 기타 */}
                {(() => {
                  const etc = getEtcConditions(conds);
                  const etcKeys = Object.keys(etc);
                  if (isEd) {
                    return <td style={S.td}>
                      <input style={{ ...S.condInput, width: 80 }} value={editBuf.etcJson || ""}
                        onChange={e => setEditBuf(b => ({ ...b, etcJson: e.target.value }))} placeholder="{}" />
                    </td>;
                  }
                  if (etcKeys.length === 0) return <td style={S.td}><span style={{ ...S.condVal, ...S.condEmpty }}>-</span></td>;
                  return (
                    <td style={{ ...S.td, maxWidth: 200 }}>
                      {etcKeys.map(k => {
                        const ev = typeof etc[k] === "object" ? JSON.stringify(etc[k]) : String(etc[k]);
                        return <span key={k} style={S.etcBadge} title={`${k}:${ev}`}>{k}:{ev}</span>;
                      })}
                    </td>
                  );
                })()}
                {/* 태그 */}
                <td style={S.td}>
                  {isEd
                    ? <select style={S.tagSelect} value={editBuf.tag} onChange={e => setEditBuf(b => ({ ...b, tag: e.target.value }))}>{TAG_LIST.map(t => <option key={t}>{t}</option>)}</select>
                    : <span style={{ ...S.tagBadge, ...tagBadgeStyle(r.tag) }}>{r.tag}</span>}
                </td>
                {/* 메시지 */}
                <td style={{ ...S.td, ...S.textCell }}>
                  {isEd
                    ? <textarea style={S.msgTextarea} value={editBuf.message} onChange={e => setEditBuf(b => ({ ...b, message: e.target.value }))} />
                    : <span>{r.message}</span>}
                </td>
                {/* 액션 */}
                <td style={{ ...S.td, whiteSpace: "nowrap" }}>
                  {isEd ? (
                    <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                      <button style={{ ...S.btnSm, ...S.btnSave }} onClick={() => saveRow(r)}>저장</button>
                      <button style={{ ...S.btnSm, ...S.btnCancel }} onClick={cancelEdit}>취소</button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 4, justifyContent: "center", alignItems: "center" }}>
                      <button style={{ ...S.btnSm, ...S.btnEdit }} onClick={() => startEdit(r)}>수정</button>
                      <label style={S.toggleWrap}>
                        <input type="checkbox" checked={!!r.enabled} onChange={e => toggleEnabled(r, e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                        <span style={{ ...S.toggleSlider, ...(r.enabled ? S.toggleSliderOn : {}) }}>
                          <span style={{ ...S.toggleKnob, ...(r.enabled ? S.toggleKnobOn : {}) }} />
                        </span>
                      </label>
                      <button style={S.delBtn} onClick={() => deleteRule(r)}>×</button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function condValStyle(cls) {
  const map = {
    has:          { background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE" },
    "bool-true":  { background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5" },
    "bool-special":{ background: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" },
    "range-high": { background: "#D1FAE5", color: "#065F46", border: "1px solid #6EE7B7" },
    "range-mid":  { background: "#E0F2FE", color: "#0369A1", border: "1px solid #7DD3FC" },
    "range-warn": { background: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" },
    "range-low":  { background: "#FFEDD5", color: "#C2410C", border: "1px solid #FDBA74" },
    "range-danger":{ background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5" },
    empty:        { color: "#CBD5E1", fontWeight: 400 },
  };
  return map[cls] || map.has;
}

function tagBadgeStyle(tag) {
  const map = {
    "강점":  { background: "rgba(5,150,105,.15)",  color: "#059669", border: "1px solid rgba(5,150,105,.3)"  },
    "보통":  { background: "rgba(100,116,139,.15)",color: "#64748B", border: "1px solid rgba(100,116,139,.3)" },
    "주의":  { background: "rgba(217,119,6,.15)",  color: "#D97706", border: "1px solid rgba(217,119,6,.3)"  },
    "위험":  { background: "rgba(220,38,38,.15)",  color: "#DC2626", border: "1px solid rgba(220,38,38,.3)"  },
    "_meta": { background: "rgba(139,92,246,.15)", color: "#8B5CF6", border: "1px solid rgba(139,92,246,.3)" },
  };
  return map[tag] || map["보통"];
}

const S = {
  layout: { display: "flex", minHeight: "calc(100vh - 56px)", background: "#F8FAFC", fontFamily: "'Pretendard','Noto Sans KR',sans-serif" },
  loading: { padding: 40, textAlign: "center", color: "#94A3B8" },
  disabled: { padding: 24, background: "#fff", border: "1px dashed #CBD5E1", borderRadius: 12, maxWidth: 600 },
  h1: { fontSize: 22, fontWeight: 700, marginBottom: 16, color: "#1E293B" },
  sidebar: { width: 200, background: "#fff", borderRight: "1px solid #E2E8F0", flexShrink: 0, position: "sticky", top: 0, alignSelf: "flex-start", height: "calc(100vh - 56px)", overflowY: "auto" },
  sidebarHeader: { padding: "20px 16px 12px", borderBottom: "1px solid #E2E8F0" },
  sidebarTitle: { fontSize: 18, fontWeight: 700, color: "#1E293B", margin: 0 },
  sidebarNav: { padding: 8 },
  navItem: (active, isContradiction, isReference) => ({
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "9px 12px", borderRadius: 6,
    fontSize: isReference ? 12 : 13, fontWeight: active ? 600 : 500, cursor: "pointer",
    color: active
      ? (isContradiction ? "#C2410C" : isReference ? "#475569" : "#2563EB")
      : (isContradiction ? "#EA580C" : isReference ? "#94A3B8" : "#64748B"),
    background: active
      ? (isContradiction ? "#FFF7ED" : isReference ? "#F1F5F9" : "#EFF6FF")
      : "transparent",
    marginBottom: 2,
    transition: "all .15s",
  }),
  navCount: (active, isContradiction) => ({
    fontSize: 11, padding: "1px 7px", borderRadius: 10,
    background: active ? (isContradiction ? "#F97316" : "#3B82F6") : "#E2E8F0",
    color: active ? "#fff" : "#64748B",
  }),
  navDivider: { height: 1, background: "#E2E8F0", margin: "8px 12px" },
  content: { flex: 1, minWidth: 0 },
  main: { padding: "24px 32px" },
  toolbar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12 },
  areaTitle: { fontSize: 14, color: "#64748B", fontWeight: 600 },
  btnPrimary: { padding: "8px 18px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", background: "#3B82F6", color: "#fff" },
  btnSync: { padding: "8px 14px", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", background: "#F59E0B", color: "#fff" },
  btnGhost: { padding: "8px 18px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13, fontWeight: 600, cursor: "pointer", background: "transparent", color: "#64748B" },
  btnSm: { padding: "5px 12px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" },
  btnSave: { background: "#059669", color: "#fff" },
  btnEdit: { background: "#F1F5F9", color: "#475569", border: "1px solid #E2E8F0" },
  btnCancel: { background: "transparent", color: "#64748B", border: "1px solid #E2E8F0" },
  dtWrap: { overflow: "auto", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,.06)", maxHeight: "calc(100vh - 200px)" },
  dt: { width: "100%", borderCollapse: "separate", borderSpacing: 0, background: "#fff", minWidth: 1200 },
  th: { background: "#E8EDF3", padding: "8px 6px", textAlign: "center", fontSize: 11, fontWeight: 600, color: "#475569", borderBottom: "1px solid #CBD5E1", borderRight: "1px solid #D5DCE5", whiteSpace: "nowrap", position: "sticky", top: 0, zIndex: 5 },
  thRow2: { top: 32 },
  thNumStickyL: { left: 0,  zIndex: 7, borderRight: "none", boxSizing: "border-box", minWidth: 40, maxWidth: 40, width: 40 },
  thIdStickyL:  { left: 40, zIndex: 7 },
  tdNumSticky:  { position: "sticky", left: 0,  zIndex: 3, borderRight: "none", boxSizing: "border-box", minWidth: 40, maxWidth: 40, width: 40 },
  tdIdSticky:   { position: "sticky", left: 40, zIndex: 3 },
  grpCond: { background: "#DBEAFE", color: "#1D4ED8", fontSize: 12, fontWeight: 700, letterSpacing: ".03em", borderBottom: "1px solid #93C5FD" },
  tr: { borderBottom: "1px solid #F1F5F9" },
  trEditing: { background: "#FFFBEB" },
  td: { padding: "6px 6px", fontSize: 12, verticalAlign: "middle", textAlign: "center", borderRight: "1px solid #F8FAFC", borderBottom: "1px solid #F1F5F9" },
  textCell: { textAlign: "left", fontSize: 12, lineHeight: 1.5, whiteSpace: "normal", color: "#334155", maxWidth: 350, minWidth: 200 },
  ruleId: { color: "#94A3B8", fontFamily: "monospace", fontSize: 11, whiteSpace: "nowrap" },
  condVal: { display: "inline-block", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" },
  condEmpty: { color: "#CBD5E1", fontWeight: 400 },
  tagBadge: { display: "inline-block", padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" },
  etcBadge: { display: "inline-block", padding: "1px 6px", borderRadius: 8, fontSize: 10, fontWeight: 500, background: "#F1F5F9", color: "#64748B", border: "1px solid #E2E8F0", margin: "1px 2px", whiteSpace: "nowrap" },
  condInput: { width: 70, padding: "3px 6px", border: "1px solid #3B82F6", borderRadius: 4, fontSize: 11, textAlign: "center", background: "#fff", fontFamily: "inherit" },
  tagSelect: { padding: "3px 6px", border: "1px solid #3B82F6", borderRadius: 4, fontSize: 11, background: "#fff", fontFamily: "inherit" },
  msgTextarea: { width: "100%", minHeight: 60, background: "#fff", border: "1px solid #3B82F6", borderRadius: 6, color: "#1E293B", padding: 8, fontSize: 12, fontFamily: "inherit", resize: "vertical" },
  toggleWrap: { position: "relative", width: 40, height: 22, cursor: "pointer", display: "inline-block", margin: "0 4px" },
  toggleSlider: { position: "absolute", inset: 0, background: "#CBD5E1", borderRadius: 11, transition: ".3s" },
  toggleSliderOn: { background: "#3B82F6" },
  toggleKnob: { position: "absolute", width: 16, height: 16, borderRadius: "50%", background: "#fff", left: 3, top: 3, transition: ".3s" },
  toggleKnobOn: { transform: "translateX(18px)" },
  delBtn: { color: "#94A3B8", cursor: "pointer", fontSize: 14, padding: "3px 6px", borderRadius: 4, background: "transparent", border: "none" },
  empty: { textAlign: "center", padding: "60px 20px", color: "#94A3B8" },
  modalOv: { position: "fixed", inset: 0, background: "rgba(0,0,0,.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: 24, width: 640, maxWidth: "90vw", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.12)" },
  modalH3: { fontSize: 16, marginBottom: 16, color: "#1E293B" },
  lbl: { display: "block", fontSize: 13, color: "#64748B", marginBottom: 6, fontWeight: 500 },
  input: { width: "100%", padding: "8px 12px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 6, color: "#1E293B", fontSize: 13, fontFamily: "inherit", marginBottom: 12, boxSizing: "border-box" },
  condGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 },
  condLbl: { fontSize: 11, color: "#64748B", marginBottom: 2 },
  btnRow: { display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 },
  toast: { position: "fixed", bottom: 24, right: 24, color: "#fff", padding: "12px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500, zIndex: 2000, boxShadow: "0 4px 20px rgba(0,0,0,.2)" },
  refWrap: { background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,.06)" },
};
