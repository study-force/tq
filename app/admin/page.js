"use client";
import React from "react";

const SECTIONS = [
  {
    href: "/admin/tq-rules",
    icon: "📘",
    title: "TQ 규칙 관리",
    desc: "TQ 의사결정 테이블, 경계값 관리",
    color: "#8B5CF6",
    bg: "#F5F3FF",
    enabled: true,
  },
  {
    href: "/admin/tq-usage",
    icon: "📈",
    title: "TQ 이용 내역",
    desc: "TQ 컨설턴트·학원별 검사 통계",
    color: "#10B981",
    bg: "#ECFDF5",
    enabled: false,
  },
];

const s = {
  wrapper: { display: "flex", alignItems: "center", justifyContent: "center", flex: 1, padding: 40, minHeight: "calc(100vh - 56px)" },
  inner: { maxWidth: 720, width: "100%" },
  title: { fontSize: 28, fontWeight: 700, color: "#1E293B", marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 15, color: "#64748B", marginBottom: 40, textAlign: "center" },
  grid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 },
  card: (bg, enabled) => ({
    background: bg, borderRadius: 16, padding: "32px 24px", textDecoration: "none",
    display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
    cursor: enabled ? "pointer" : "not-allowed", opacity: enabled ? 1 : 0.55,
    transition: "transform 0.15s, box-shadow 0.15s",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  }),
  cardIcon: { fontSize: 40, marginBottom: 12 },
  cardTitle: (color) => ({ fontSize: 17, fontWeight: 700, color, marginBottom: 6 }),
  cardDesc: { fontSize: 13, color: "#64748B", lineHeight: 1.5 },
  cardBadge: { marginTop: 10, fontSize: 11, fontWeight: 600, color: "#94A3B8", background: "rgba(0,0,0,0.05)", padding: "3px 10px", borderRadius: 10 },
};

export default function AdminHome() {
  return (
    <div style={s.wrapper}>
      <div style={s.inner}>
        <div style={s.title}>TQ 관리 영역</div>
        <div style={s.subtitle}>관리할 항목을 선택하세요</div>
        <div style={s.grid}>
          {SECTIONS.map(sec => {
            const inner = (
              <>
                <div style={s.cardIcon}>{sec.icon}</div>
                <div style={s.cardTitle(sec.color)}>{sec.title}</div>
                <div style={s.cardDesc}>{sec.desc}</div>
                {!sec.enabled && <div style={s.cardBadge}>준비 중</div>}
              </>
            );
            return sec.enabled
              ? <a key={sec.href} href={sec.href} style={s.card(sec.bg, true)}>{inner}</a>
              : <div key={sec.href} style={s.card(sec.bg, false)}>{inner}</div>;
          })}
        </div>
      </div>
    </div>
  );
}
