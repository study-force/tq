"use client";
import React, { useEffect, useState } from "react";

function todayStr() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

function fmtGrade(section, grade) {
  const SHORT = { "초저":"초", "초고":"초", "초등":"초", "중등":"중", "고등":"고" };
  const s = section ? (SHORT[section] || section) : "";
  if (s && grade) return `${s}${grade}`;
  if (grade) return `${grade}`;
  if (s) return s;
  return "-";
}

function fmtDateTime(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  // KST(Asia/Seoul) 기준으로 YYYY-MM-DD HH:mm 출력
  // sv-SE 로케일이 ISO 유사 포맷을 보장
  try {
    return new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Asia/Seoul",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false,
    }).format(d).replace("T", " ");
  } catch {
    return d.toISOString();
  }
}

const DEFAULT_UNIT_COST = 50; // 원. 검사 1건당 예상 API 비용 (사용자 조정 가능)

export default function TqUsagePage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo]     = useState("");
  const [unitCost, setUnitCost] = useState(DEFAULT_UNIT_COST);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 100;

  useEffect(() => { setPage(1); }, [from, to]);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("tq_unit_cost") : null;
    if (saved) setUnitCost(Number(saved) || DEFAULT_UNIT_COST);
  }, []);

  const saveUnitCost = (v) => {
    setUnitCost(v);
    if (typeof window !== "undefined") localStorage.setItem("tq_unit_cost", String(v));
  };

  const load = () => {
    setLoading(true); setError(null);
    const p = new URLSearchParams();
    if (from) p.set("from", from);
    if (to)   p.set("to", to);
    const qs = p.toString();
    fetch("/api/admin/tq-usage" + (qs ? "?" + qs : ""))
      .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)))
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.error || "로드 실패"); setLoading(false); });
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [from, to]);

  const applyPreset = (preset) => {
    const t = todayStr();
    if (preset === "all")        { setFrom(""); setTo(""); }
    else if (preset === "today") { setFrom(t); setTo(t); }
    else if (preset === "7d") {
      const d = new Date(); d.setDate(d.getDate() - 6);
      const pad = (n) => String(n).padStart(2, "0");
      setFrom(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`); setTo(t);
    } else if (preset === "30d") {
      const d = new Date(); d.setDate(d.getDate() - 29);
      const pad = (n) => String(n).padStart(2, "0");
      setFrom(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`); setTo(t);
    }
  };

  if (data && data.enabled === false) {
    return (
      <div style={{ padding: 40 }}>
        <h1 style={S.title}>TQ 이용 내역</h1>
        <div style={S.disabled}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>TQ 연결이 설정되지 않았습니다.</div>
          <div style={{ fontSize: 13, color: "#64748B" }}>
            환경변수 <code>TQ_SUPABASE_URL</code> / <code>TQ_SUPABASE_SERVICE_ROLE_KEY</code> 설정이 필요합니다.
          </div>
        </div>
      </div>
    );
  }

  if (error) return <div style={{ padding: 40, color: "#991B1B" }}>오류: {error}</div>;
  if (!data) return <div style={{ padding: 40, color: "#64748B" }}>로딩 중…</div>;

  const maxDaily = Math.max(...data.dailyTrend.map(d => d.count), 1);
  const topAcademies = Object.entries(data.academyCount).sort((a,b) => b[1]-a[1]);
  // 학년 분포 정렬: 섹션 순서(초저→초고→초등→중등→고등→기타→미입력) + 학년 숫자 오름차순
  const SECTION_ORDER = ["초등","중등","고등"];
  const gradeSortKey = (label) => {
    if (label === "(미입력)") return [999, 999];
    const m = label.match(/^(.+?)\s*(\d+)학년$/);
    if (m) {
      const idx = SECTION_ORDER.indexOf(m[1]);
      return [idx === -1 ? 500 : idx, Number(m[2])];
    }
    const idx = SECTION_ORDER.indexOf(label);
    return [idx === -1 ? 500 : idx, 0];
  };
  const gradeRows = Object.entries(data.gradeCount).sort((a, b) => {
    const [sa, ga] = gradeSortKey(a[0]);
    const [sb, gb] = gradeSortKey(b[0]);
    return sa - sb || ga - gb;
  });
  const maxGrade = Math.max(...gradeRows.map(g => g[1]), 1);
  const maxAcademy = Math.max(...topAcademies.map(g => g[1]), 1);

  const internalCount = data.internalCount || 0;
  const emptyCount = data.emptyCount || 0;
  const academyTotal = topAcademies.reduce((s, [,c]) => s + c, 0);

  return (
    <div style={{ padding: "32px 40px" }}>
      <h1 style={S.title}>TQ 이용 내역</h1>

      {/* 날짜 필터 */}
      <div style={S.filterBar}>
        <button onClick={() => applyPreset("all")}   style={S.presetBtn(!from && !to)}>전체</button>
        <button onClick={() => applyPreset("today")} style={S.presetBtn(false)}>오늘</button>
        <button onClick={() => applyPreset("7d")}    style={S.presetBtn(false)}>7일</button>
        <button onClick={() => applyPreset("30d")}   style={S.presetBtn(false)}>30일</button>
        <span style={{ color:"#CBD5E1", margin:"0 4px" }}>|</span>
        <label style={{ color:"#64748B", fontSize:13 }}>시작</label>
        <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={S.dateInput}/>
        <label style={{ color:"#64748B", fontSize:13 }}>종료</label>
        <input type="date" value={to} onChange={e => setTo(e.target.value)} style={S.dateInput}/>
        {loading && <span style={{ color:"#94A3B8", fontSize:12 }}>업데이트 중…</span>}
      </div>

      {/* 요약 */}
      <div style={S.grid4}>
        <div style={S.statCard}>
          <div style={S.statLabel}>기간 내 검사 수</div>
          <div style={S.statValue}>{data.totalCount.toLocaleString()}</div>
        </div>
        <div style={S.statCard}>
          <div style={S.statLabel}>오늘 검사 수</div>
          <div style={S.statValue}>{data.todayCount.toLocaleString()}</div>
        </div>
        <div style={S.statCard}>
          <div style={S.statLabel}>학원 사용 (실토큰)</div>
          <div style={S.statValue}>{academyTotal.toLocaleString()}</div>
          <div style={S.statSub}>학원 수 {Object.keys(data.academyCount).length.toLocaleString()}개</div>
        </div>
        <div style={S.statCard}>
          <div style={S.statLabel}>내부/미입력</div>
          <div style={S.statValue}>{(internalCount + emptyCount).toLocaleString()}</div>
          <div style={S.statSub}>내부 {internalCount.toLocaleString()} · 미입력 {emptyCount.toLocaleString()}</div>
        </div>
      </div>

      {/* 일별 추이 */}
      <div style={S.section}>
        <div style={S.sectionTitle}>일별 검사 추이 (최근 30일)</div>
        <div style={S.trendContainer}>
          {data.dailyTrend.map((d) => (
            <div key={d.date} style={S.trendBar((d.count / maxDaily) * 100)} title={`${d.date}: ${d.count}건`}/>
          ))}
        </div>
        <div style={S.trendLabels}>
          <span>{data.dailyTrend[0]?.date?.slice(5)}</span>
          <span>{data.dailyTrend[data.dailyTrend.length - 1]?.date?.slice(5)}</span>
        </div>
      </div>

      <div style={S.grid2}>
        {/* API 예상 금액 */}
        <div style={S.section}>
          <div style={S.sectionTitle}>API 예상 총 금액</div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16, flexWrap:"wrap" }}>
            <label style={{ fontSize:13, color:"#64748B" }}>검사 1건당 단가</label>
            <input
              type="number" min={0} step={1} value={unitCost}
              onChange={e => saveUnitCost(Number(e.target.value) || 0)}
              style={{ width:100, padding:"6px 10px", border:"1px solid #E2E8F0", borderRadius:6, fontSize:13, textAlign:"right" }}
            />
            <span style={{ fontSize:13, color:"#64748B" }}>원</span>
          </div>
          <div style={{ fontSize:13, color:"#64748B", marginBottom:4 }}>기간 내 검사 {data.totalCount.toLocaleString()}건</div>
          <div style={{ fontSize:36, fontWeight:700, color:"#8B5CF6", letterSpacing:-0.5 }}>
            ₩ {(data.totalCount * unitCost).toLocaleString()}
          </div>
          <div style={{ fontSize:12, color:"#94A3B8", marginTop:10, lineHeight:1.6 }}>
            · 단가는 관리자가 조정 (브라우저에 저장)<br/>
            · 내부(sf_internal_*)·미입력 건도 포함한 전체 호출 기준
          </div>
          <hr style={{ border:"none", borderTop:"1px dashed #E2E8F0", margin:"16px 0" }}/>
          <div style={{ fontSize:12, color:"#64748B", display:"grid", gridTemplateColumns:"1fr auto", rowGap:4, columnGap:12 }}>
            <span>오늘 ({data.todayCount.toLocaleString()}건)</span>
            <span style={{ fontFamily:"monospace" }}>₩ {(data.todayCount * unitCost).toLocaleString()}</span>
            <span>실학원 ({(topAcademies.reduce((s,[,c])=>s+c,0)).toLocaleString()}건)</span>
            <span style={{ fontFamily:"monospace" }}>₩ {(topAcademies.reduce((s,[,c])=>s+c,0) * unitCost).toLocaleString()}</span>
            <span>내부+미입력 ({((data.internalCount||0)+(data.emptyCount||0)).toLocaleString()}건)</span>
            <span style={{ fontFamily:"monospace" }}>₩ {(((data.internalCount||0)+(data.emptyCount||0)) * unitCost).toLocaleString()}</span>
          </div>
        </div>

        {/* 학년 분포 */}
        <div style={S.section}>
          <div style={S.sectionTitle}>학년 분포 (user_school_grade)</div>
          {gradeRows.length === 0 && <div style={S.empty}>데이터 없음</div>}
          {gradeRows.map(([g, cnt]) => (
            <div key={g} style={S.barRow}>
              <div style={S.barLabel}>{g}</div>
              <div style={S.barTrack}><div style={S.barFill((cnt/maxGrade)*100, "#64748B")}/></div>
              <div style={S.barCount}>{cnt}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 최근 검사 */}
      {(() => {
        const total = data.recent.length;
        const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
        const curPage = Math.min(page, totalPages);
        const start = (curPage - 1) * PAGE_SIZE;
        const pageRows = data.recent.slice(start, start + PAGE_SIZE);
        const goto = (p) => setPage(Math.max(1, Math.min(totalPages, p)));
        return (
          <div style={S.section}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div style={{ fontSize:16, fontWeight:600, color:"#1E293B" }}>
                검사 목록 <span style={{ fontSize:13, color:"#94A3B8", fontWeight:400, marginLeft:6 }}>총 {total.toLocaleString()}건</span>
              </div>
              <div style={{ fontSize:12, color:"#64748B" }}>
                {total === 0 ? "0" : `${(start+1).toLocaleString()}–${Math.min(start+PAGE_SIZE, total).toLocaleString()}`} / {total.toLocaleString()}
              </div>
            </div>
            <div style={{ overflowX:"auto" }}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>#</th>
                    <th style={S.th}>검사일</th>
                    <th style={S.th}>저장일시 (KST)</th>
                    <th style={S.th}>이름</th>
                    <th style={S.th}>학년</th>
                    <th style={S.th}>학원 토큰</th>
                    <th style={S.th}>독해력</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r, i) => (
                    <tr key={r.id} style={S.tr}>
                      <td style={{ ...S.td, color:"#94A3B8", fontSize:12, fontVariantNumeric:"tabular-nums" }}>{(total - (start + i)).toLocaleString()}</td>
                      <td style={S.td}>{r.reg_date || "-"}</td>
                      <td style={{ ...S.td, color:"#64748B", fontSize:12 }}>{fmtDateTime(r.created_at)}</td>
                      <td style={S.td}>{r.name}</td>
                      <td style={S.td}>{fmtGrade(r.section, r.grade)}</td>
                      <td style={{ ...S.td, fontFamily:"monospace", fontSize:11, color:"#64748B" }}>
                        {r.academy_token ? (r.academy_token.length > 16 ? r.academy_token.slice(0, 12) + "…" : r.academy_token) : "-"}
                      </td>
                      <td style={S.td}>{r.reading_score}</td>
                    </tr>
                  ))}
                  {pageRows.length === 0 && (
                    <tr><td colSpan={7} style={{ ...S.td, textAlign:"center", color:"#94A3B8", padding:24 }}>데이터 없음</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:6, marginTop:16 }}>
                <button onClick={() => goto(1)}          disabled={curPage===1} style={S.pageBtn(false, curPage===1)}>«</button>
                <button onClick={() => goto(curPage-1)}  disabled={curPage===1} style={S.pageBtn(false, curPage===1)}>‹</button>
                {(() => {
                  const nums = [];
                  const win = 2;
                  let s = Math.max(1, curPage - win);
                  let e = Math.min(totalPages, curPage + win);
                  if (s > 1) nums.push(1, s > 2 ? "…1" : null);
                  for (let i = s; i <= e; i++) nums.push(i);
                  if (e < totalPages) nums.push(e < totalPages - 1 ? "…2" : null, totalPages);
                  return nums.filter(Boolean).map((n, i) =>
                    typeof n === "number"
                      ? <button key={i} onClick={() => goto(n)} style={S.pageBtn(n===curPage, false)}>{n}</button>
                      : <span key={i} style={{ color:"#CBD5E1", padding:"0 4px" }}>…</span>
                  );
                })()}
                <button onClick={() => goto(curPage+1)}  disabled={curPage===totalPages} style={S.pageBtn(false, curPage===totalPages)}>›</button>
                <button onClick={() => goto(totalPages)} disabled={curPage===totalPages} style={S.pageBtn(false, curPage===totalPages)}>»</button>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

const S = {
  title: { fontSize: 24, fontWeight: 700, color: "#1E293B", marginBottom: 24 },
  disabled: { padding: 32, background: "#fff", borderRadius: 12, border: "1px dashed #CBD5E1", maxWidth: 600 },
  filterBar: { display:"flex", alignItems:"center", gap:8, marginBottom:20, flexWrap:"wrap" },
  presetBtn: (active) => ({
    padding:"6px 12px", border:"1px solid #E2E8F0", borderRadius:6,
    background: active ? "#3B82F6" : "#fff",
    color: active ? "#fff" : "#475569",
    cursor:"pointer", fontSize:12,
  }),
  dateInput: { padding:"5px 8px", border:"1px solid #E2E8F0", borderRadius:6, fontSize:13, color:"#1E293B" },
  grid4: { display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:16, marginBottom:24 },
  grid2: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:24, marginBottom:24 },
  statCard: { background:"#fff", borderRadius:12, padding:"20px 24px", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" },
  statLabel: { fontSize:13, color:"#64748B", marginBottom:6 },
  statValue: { fontSize:28, fontWeight:700, color:"#1E293B" },
  statSub: { fontSize:11, color:"#94A3B8", marginTop:4 },
  section: { background:"#fff", borderRadius:12, padding:24, boxShadow:"0 1px 3px rgba(0,0,0,0.06)", marginBottom:24 },
  sectionTitle: { fontSize:16, fontWeight:600, color:"#1E293B", marginBottom:16 },
  empty: { color:"#94A3B8", fontSize:13, padding:"12px 0" },
  barRow: { display:"flex", alignItems:"center", gap:12, marginBottom:8 },
  barLabel: { width:140, fontSize:13, color:"#475569", textAlign:"right", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" },
  barTrack: { flex:1, height:24, background:"#F1F5F9", borderRadius:6, overflow:"hidden" },
  barFill: (pct, color) => ({ width:`${pct}%`, height:"100%", background:color, borderRadius:6, transition:"width 0.4s ease", minWidth: pct>0?4:0 }),
  barCount: { width:50, fontSize:13, color:"#64748B", textAlign:"right" },
  trendContainer: { display:"flex", alignItems:"flex-end", gap:2, height:120 },
  trendBar: (pct) => ({ flex:1, background:"#3B82F6", borderRadius:"3px 3px 0 0", height:`${Math.max(pct, 2)}%`, transition:"height 0.4s ease" }),
  trendLabels: { display:"flex", justifyContent:"space-between", fontSize:11, color:"#94A3B8", marginTop:6 },
  table: { width:"100%", borderCollapse:"collapse", fontSize:13 },
  th: { textAlign:"left", padding:"10px 12px", borderBottom:"1px solid #E2E8F0", color:"#64748B", fontWeight:600, background:"#F8FAFC", whiteSpace:"nowrap" },
  tr: { borderBottom:"1px solid #F1F5F9" },
  td: { padding:"10px 12px", color:"#1E293B", whiteSpace:"nowrap" },
  pageBtn: (active, disabled) => ({
    minWidth: 32, height: 32, padding: "0 10px",
    border: "1px solid " + (active ? "#3B82F6" : "#E2E8F0"),
    background: active ? "#3B82F6" : "#fff",
    color: active ? "#fff" : (disabled ? "#CBD5E1" : "#475569"),
    borderRadius: 6, fontSize: 13, fontWeight: active ? 600 : 400,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
  }),
};
