// 정적 참고 페이지 3개를 React 컴포넌트로 포팅 (기존 HTML과 동일 내용)
import React from "react";

const R = {
  h2: { fontSize: 18, fontWeight: 700, color: "#1E293B", marginBottom: 6 },
  desc: { fontSize: 12, color: "#94A3B8", marginBottom: 20 },
  table: { width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,.06)" },
  th: { background: "#F8FAFC", padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748B", borderBottom: "1px solid #E2E8F0" },
  td: { padding: "10px 14px", fontSize: 12, color: "#334155", borderBottom: "1px solid #F1F5F9", verticalAlign: "top" },
  varCell: { fontFamily: "monospace", fontWeight: 700, color: "#2563EB", fontSize: 12 },
  vals: { color: "#059669", fontWeight: 600, fontSize: 11 },
  note: { marginTop: 16, padding: "12px 16px", background: "#FFF7ED", border: "1px solid #FDBA74", borderRadius: 8, fontSize: 11, color: "#9A3412", lineHeight: 1.7 },
  box: { background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: "16px 20px", marginBottom: 16 },
  boxTitle: { fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 8 },
  layer: { borderRadius: 8, padding: "14px 18px", marginBottom: 8 },
  layer1: { background: "#F5F3FF", border: "1px solid #C4B5FD" },
  layer2: { background: "#F0FDF4", border: "1px solid #86EFAC" },
  layer3: { background: "#FFF7ED", border: "1px solid #FDBA74" },
  layerTitle: { fontSize: 12, fontWeight: 700, marginBottom: 6 },
  layerDesc: { fontSize: 11, color: "#64748B", lineHeight: 1.7 },
  tag: { background: "#fff", border: "1px solid currentColor", borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 600 },
};

export function BoundaryView() {
  return (
    <div>
      <h2 style={R.h2}>경계값 기준표</h2>
      <p style={R.desc}>각 변수가 엔진 내에서 분기 기준으로 사용되는 경계값. 단일 변수 기준이며 교차조합 전체를 나타내지는 않음.</p>
      <table style={R.table}>
        <thead>
          <tr>
            <th style={{ ...R.th, width: 90 }}>변수</th>
            <th style={{ ...R.th, width: 140 }}>의미</th>
            <th style={R.th}>경계값</th>
            <th style={R.th}>구간 설명</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style={{ ...R.td, ...R.varCell }}>acc</td><td style={R.td}>독해정확도</td><td style={{ ...R.td, ...R.vals }}>10, 20, 30, 40, 50, 60, 65, 70, 85, 90</td><td style={R.td}>&lt;10 재검사 / 10~29 심각 / 30~49 부족 / 50~64 보통 / 65~69 보통상 / 70~84 우수 / 85~89 상위 / ≥90 최상위</td></tr>
          <tr>
            <td style={{ ...R.td, ...R.varCell }}>spd<br /><span style={{ fontSize: 10, color: "#94A3B8" }}>(자/분)</span></td>
            <td style={R.td}>독해속도<br /><span style={{ fontSize: 10, color: "#94A3B8" }}>학제별 기준</span></td>
            <td style={{ ...R.td, ...R.vals, lineHeight: 1.8 }}>초저: 300, 500, 700<br />초고: 400, 650, 900<br />중등: 450, 700, 1000<br />고등: 450, 700, 1000</td>
            <td style={{ ...R.td, lineHeight: 1.8 }}><b>초저:</b> &lt;300 느림 / 300~499 보통이하 / 500~699 보통이상 / ≥700 빠름<br /><b>초고:</b> &lt;400 느림 / 400~649 보통이하 / 650~899 보통이상 / ≥900 빠름<br /><b>중등:</b> &lt;450 느림 / 450~699 보통이하 / 700~999 보통이상 / ≥1000 빠름<br /><b>고등:</b> 중등과 동일</td>
          </tr>
          <tr><td style={{ ...R.td, ...R.varCell }}>voc</td><td style={R.td}>어휘능력</td><td style={{ ...R.td, ...R.vals }}>35, 40, 50, 60, 75</td><td style={R.td}>&lt;35 심각 / 35~49 부족 / 50~59 보통하 / 60~74 보통 / ≥75 우수</td></tr>
          <tr><td style={{ ...R.td, ...R.varCell }}>wm</td><td style={R.td}>워킹메모리</td><td style={{ ...R.td, ...R.vals }}>20, 30, 40, 50, 60, 80</td><td style={R.td}>&lt;20 심각 / 20~29 부족 / 30~39 주의 / 40~49 보통하 / 50~59 보통 / 60~79 양호 / ≥80 우수</td></tr>
          <tr><td style={{ ...R.td, ...R.varCell }}>inf</td><td style={R.td}>추론능력</td><td style={{ ...R.td, ...R.vals }}>35, 40, 50, 60, 70</td><td style={R.td}>&lt;35 결손 / 35~49 부족 / 50~59 보통 / 60~69 양호 / ≥70 우수</td></tr>
          <tr><td style={{ ...R.td, ...R.varCell }}>eff</td><td style={R.td}>독해효율성</td><td style={{ ...R.td, ...R.vals }}>40, 60, 70, 90</td><td style={R.td}>&lt;40 심각 / 40~59 회의감 / 60~69 보통 / 70~89 양호 / ≥90 긍정</td></tr>
          <tr>
            <td style={{ ...R.td, ...R.varCell }}>kv<br /><span style={{ fontSize: 10, color: "#94A3B8" }}>(정규화)</span></td>
            <td style={R.td}>국어성적</td>
            <td style={{ ...R.td, ...R.vals, lineHeight: 1.8 }}><b>초등:</b> 노력요함→50 / 보통→70 / 잘함→80 / 매우잘함→90<br /><b>중등:</b> 60미만→50 / 60~69→60 / 70~79→70 / 80~89→80 / 90↑→90<br /><b>고등:</b> 5등급↓→50 / 4등급→60 / 3등급→70 / 2등급→80 / 1등급→90</td>
            <td style={R.td}>최상위: kv≥90 / 상위: kv≥80 / 중위: kv≥70 / 하위: kv≥60 / 최하위: kv&lt;60</td>
          </tr>
          <tr><td style={{ ...R.td, ...R.varCell, color: "#DC2626" }}>flagC</td><td style={R.td}>모순패턴</td><td style={{ ...R.td, ...R.vals, color: "#DC2626" }}>kv ≥ 80 AND acc ≤ 30</td><td style={R.td}>두 변수 교차. 경계: acc=30/31, kv=79/80</td></tr>
          <tr><td style={{ ...R.td, ...R.varCell, color: "#D97706" }}>flagO</td><td style={R.td}>선행과부하</td><td style={{ ...R.td, ...R.vals, color: "#D97706" }}>acc ≥ 60 AND eff ≤ 40</td><td style={R.td}>두 변수 교차. 경계: acc=59/60, eff=40/41</td></tr>
          <tr><td style={{ ...R.td, ...R.varCell }}>habClass</td><td style={R.td}>음독분류</td><td style={{ ...R.td, ...R.vals }}>없음 / 경미 / 보통 / 심함</td><td style={R.td}>체크박스 10개 → classifyHabits() → 4단계</td></tr>
        </tbody>
      </table>
      <div style={R.note}>⚠ 이 표는 단일 변수 기준입니다. 실제 메시지는 여러 변수가 동시에 교차할 때 결정되므로, 교차 검증은 실제 학생 데이터로 진행하는 것이 현실적입니다.</div>
    </div>
  );
}

export function LogicView() {
  return (
    <div>
      <h2 style={R.h2}>TQ 판독 엔진 — 로직 구조</h2>
      <p style={R.desc}>엔진 수정 전 반드시 읽어야 할 구조 참고 문서입니다.</p>

      <div style={R.box}>
        <div style={R.boxTitle}>엔진 전체 흐름 — 입력 → 처리 → 출력</div>
        <p style={{ fontSize: 11, color: "#94A3B8", marginBottom: 14 }}>
          구조: <b style={{ color: "#1E293B" }}>"3층 수직 트리 × 각 층에서 다변수 매트릭스 교차"</b>
        </p>
        <div style={{ ...R.layer, ...R.layer1 }}>
          <div style={{ ...R.layerTitle, color: "#4C1D95" }}>1층 — 구조 분류 (runEngine)</div>
          <div style={R.layerDesc}>
            acc × inf → <b>9유형</b> (S1/S2/A1/A2/A3/M1/M2/L/C)<br />
            성적(kv) × acc → <b>flagC</b> (모순패턴) | eff체크 → <b>flagO</b> (선행과부하)<br />
            복합 조건 → <b>긴급도</b> (즉각/조기/중장기)
          </div>
        </div>
        <div style={{ textAlign: "center", color: "#94A3B8", fontSize: 14, margin: "4px 0" }}>↓ 유형·플래그·긴급도 결정 후</div>
        <div style={{ ...R.layer, ...R.layer2 }}>
          <div style={{ ...R.layerTitle, color: "#065F46" }}>2층 — 9개 항목 병렬 실행 (collectEvidence)</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
            {["1)성적","2)속도","3)독서","4)독해질","5)음독","6)WM","7)추론","8)효율","9)학업"].map(t => (
              <span key={t} style={{ ...R.tag, color: "#065F46" }}>{t}</span>
            ))}
          </div>
          <div style={R.layerDesc}>각 항목 내부: 미니 매트릭스 교차<br />예) 5번 정보처리습관: acc(3단계) × spd(3단계) × 음독심각도 → 다변수 조합</div>
        </div>
        <div style={{ textAlign: "center", color: "#94A3B8", fontSize: 14, margin: "4px 0" }}>↓</div>
        <div style={{ ...R.layer, ...R.layer3 }}>
          <div style={{ ...R.layerTitle, color: "#9A3412" }}>3층 — 출력 조합</div>
          <div style={R.layerDesc}>9개 항목 bullets 합산 → 결과화면 표시 + LLM 판독문 생성 전달 + 프로그램 추천</div>
        </div>
      </div>

      <div style={R.box}>
        <div style={R.boxTitle}>핵심 교차 변수 — 수정 시 주의</div>
        <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.8 }}>
          • <b style={{ color: "#DC2626" }}>flagC/flagO</b> 변경 → 1·5·8·9번 동시 영향<br />
          • <b style={{ color: "#2563EB" }}>habClass</b> 변경 → 5번 전체 재검토 필요<br />
          • <b style={{ color: "#059669" }}>acc 경계값</b> 변경 → 거의 모든 영역에 영향 (가장 많이 사용되는 변수)<br />
          • <b style={{ color: "#7C3AED" }}>spdGrade</b> 변경 → 2·5번 동시 영향
        </div>
      </div>

      <div style={R.box}>
        <div style={R.boxTitle}>유형 분류 매트릭스</div>
        <table style={{ ...R.table, marginTop: 8 }}>
          <thead><tr><th style={R.th}>코드</th><th style={R.th}>유형명</th><th style={R.th}>조건</th></tr></thead>
          <tbody>
            <tr><td style={{ ...R.td, ...R.varCell }}>S1</td><td style={R.td}>최상위권 공부 역량</td><td style={R.td}>acc≥90 AND (inf+voc)&gt;130</td></tr>
            <tr><td style={{ ...R.td, ...R.varCell }}>S2</td><td style={R.td}>고정확 부분결함형</td><td style={R.td}>acc≥90 (그 외)</td></tr>
            <tr><td style={{ ...R.td, ...R.varCell }}>A1</td><td style={R.td}>이해 중심 공부 성향</td><td style={R.td}>acc≥70 AND inf≥70</td></tr>
            <tr><td style={{ ...R.td, ...R.varCell }}>A2</td><td style={R.td}>노력형 상위권</td><td style={R.td}>acc≥70 AND inf≥50</td></tr>
            <tr><td style={{ ...R.td, ...R.varCell }}>A3</td><td style={R.td}>암기 의존적 공부 주의</td><td style={R.td}>acc≥70 AND inf&lt;50</td></tr>
            <tr><td style={{ ...R.td, ...R.varCell }}>M1</td><td style={R.td}>잠재된 논리적 사고 성향</td><td style={R.td}>acc≥50 AND inf≥70</td></tr>
            <tr><td style={{ ...R.td, ...R.varCell }}>M2</td><td style={R.td}>역량 미완성형</td><td style={R.td}>acc≥50 AND inf&lt;70</td></tr>
            <tr><td style={{ ...R.td, ...R.varCell }}>L</td><td style={R.td}>기초 역량 부족형</td><td style={R.td}>acc≥30</td></tr>
            <tr><td style={{ ...R.td, ...R.varCell }}>C</td><td style={R.td}>학습 기능 발달 시급</td><td style={R.td}>acc&lt;30</td></tr>
          </tbody>
        </table>
      </div>

      <div style={R.box}>
        <div style={R.boxTitle}>플래그·긴급도 조건</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ background: "#DC2626", color: "#fff", borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>flagC</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#991B1B" }}>모순패턴</span>
            </div>
            <div style={{ fontSize: 11, color: "#7F1D1D", lineHeight: 1.7 }}>kv ≥ 80 AND acc ≤ 30<br />→ 즉각개입 긴급도 강제 상향</div>
          </div>
          <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "10px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ background: "#D97706", color: "#fff", borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>flagO</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#92400E" }}>선행과부하</span>
            </div>
            <div style={{ fontSize: 11, color: "#78350F", lineHeight: 1.7 }}>acc ≥ 60 AND eff ≤ 40<br />→ 효율성 저하 원인으로 서술</div>
          </div>
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#1E293B", marginBottom: 8 }}>긴급도 판정</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            ["즉각", "#DC2626", "flagC OR (acc<30 AND 성적정상) OR acc<20"],
            ["조기", "#D97706", "acc 30~49 AND (결손요인 2개↑) OR (WM 30~39) OR (inf<40)"],
            ["중장기", "#059669", "위 조건 미해당 — 예방적 관리 수준"],
          ].map(([lbl, color, desc]) => (
            <div key={lbl} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ background: color, color: "#fff", borderRadius: 4, padding: "2px 10px", fontSize: 10, fontWeight: 700, minWidth: 38, textAlign: "center" }}>{lbl}</span>
              <span style={{ fontSize: 11, color: "#475569" }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={R.box}>
        <div style={R.boxTitle}>QC 전략</div>
        <p style={{ fontSize: 12, color: "#475569", marginBottom: 12 }}>이산화 후 유효 조합 약 <b style={{ color: "#1E293B" }}>9.8조 가지</b> — 전수 테스트 불가.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            ["1", "#DC2626", "flagC/flagO/habClass 경계값 테스트 (연쇄 영향 최대)"],
            ["2", "#D97706", "9번 학교학업 — 3과목 × acc × 학제 조합표 검증"],
            ["3", "#059669", <>실제 학생 데이터 20~30건으로 교차 검증 <b>(가장 현실적)</b></>],
          ].map(([num, color, text]) => (
            <div key={num} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ background: color, color: "#fff", borderRadius: "50%", width: 20, height: 20, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{num}</span>
              <span style={{ fontSize: 12, color: "#475569" }}>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function VariablesView() {
  const VarTable = ({ title, rows }) => (
    <div style={R.box}>
      <div style={R.boxTitle}>{title}</div>
      <table style={{ ...R.table, marginTop: 8 }}>
        <thead><tr><th style={{ ...R.th, width: 100 }}>변수</th><th style={{ ...R.th, width: 160 }}>의미</th><th style={R.th}>범위 / 설명</th></tr></thead>
        <tbody>
          {rows.map(([v, meaning, desc, color]) => (
            <tr key={v}><td style={{ ...R.td, ...R.varCell, ...(color ? { color } : {}) }}>{v}</td><td style={R.td}>{meaning}</td><td style={R.td}>{desc}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <h2 style={R.h2}>변수 약어 전체 목록</h2>
      <p style={R.desc}>엔진에서 사용하는 모든 변수명과 의미. 의사결정 테이블의 조건 컬럼과 매칭됩니다.</p>

      <VarTable title="기본 입력 변수" rows={[
        ["acc", "독해정확도", "0~100. (fct + str) / 2. 가장 핵심 변수"],
        ["fct", "사실적 이해", "0~100. 세부 정보 파악 능력"],
        ["str", "구조적 이해", "0~100. 글 구조·흐름·의도 파악"],
        ["spd", "독해속도", "자/분 단위. 학제별 기준 상이"],
        ["voc", "어휘능력", "0~100. 독서량의 프록시"],
        ["wm",  "워킹메모리", "0~100. 작업기억 용량"],
        ["inf", "추론능력", "0~100. 논리적 사고력"],
        ["hab", "독해습관 점수", "0~100. 체크 수 반비례"],
        ["eff", "독해효율성 점수", "0~100. 체크 수 반비례"],
      ]} />

      <VarTable title="성적 관련 변수" rows={[
        ["kv",       "국어성적 정규화값", "50/60/70/80/90 (null 가능). 학제별 입력 형태 다름", "#2563EB"],
        ["engVal",   "영어성적 정규화값", "kv와 동일 기준 (null 가능)"],
        ["mathVal",  "수학성적 정규화값", "kv와 동일 기준 (null 가능)"],
      ]} />

      <VarTable title="파생 / 플래그 변수" rows={[
        ["flagC",   "모순패턴", "boolean. kv ≥ 80 AND acc ≤ 30일 때 true", "#DC2626"],
        ["flagO",   "선행과부하", "boolean. acc ≥ 60 AND eff ≤ 40일 때 true", "#D97706"],
        ["habClass","음독 분류 결과", "객체. 심각도: 없음/경미/보통/심함. 표면음독, 내재음독이해 등"],
        ["spdGrade","독해속도 등급", "느림 / 보통이하 / 보통이상 / 빠름 (학제별 기준)"],
        ["gap",     "사실-구조 갭", "fct - str. 양수=사실우세, 음수=구조우세"],
        ["invSpd",  "속도 이상값", "boolean. 학제별 상한 초과 또는 50 미만"],
        ["allHigh", "전 과목 최상위", "boolean. 국영수 모두 90 이상"],
        ["examRelated", "시험 관련 체크 수", "0~4. 효율성 체크 중 시험 관련 항목 수"],
      ]} />

      <VarTable title="특수 변수" rows={[
        ["_meta",     "LLM 전달용 힌트", "화면 미표시. AI 판독문 생성 시 참고 지침", "#7C3AED"],
        ["level",     "엔진 내부 학제", "초저/초고/중등/고등/일반"],
        ["uiLevel",   "UI 표시 학제", "초등/중등/고등/일반"],
        ["두꺼운체크", "두꺼운 책 체크", "boolean. 효율성 체크 \"두꺼운 책\" 항목"],
        ["독서량체크", "독서량 체크", "boolean. 효율성 체크 \"독서량\" 항목"],
        ["밤새워체크", "밤새워 책 체크", "boolean. 효율성 체크 \"밤새워\" 항목"],
      ]} />
    </div>
  );
}
