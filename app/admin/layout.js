"use client";
import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const s = {
  layout: { display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", background: "#F8F9FA", fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif" },
  topBar: { height: 56, background: "#1E293B", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0 },
  topLogo: { fontSize: 16, fontWeight: 700, color: "#fff", textDecoration: "none", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" },
  topLogout: { background: "transparent", border: "1px solid #475569", color: "#94A3B8", borderRadius: 6, padding: "6px 14px", fontSize: 12, cursor: "pointer" },
  main: { flex: 1, overflowY: "auto" },
  loading: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontSize: 16, color: "#64748B" },
};

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    fetch("/api/admin/auth")
      .then(r => r.json())
      .then(d => {
        if (d.authenticated) { setAuth(true); }
        else {
          setAuth(false);
          if (pathname !== "/admin/login") router.replace("/admin/login");
        }
      })
      .catch(() => { setAuth(false); router.replace("/admin/login"); });
  }, [pathname, router]);

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.replace("/admin/login");
  };

  if (pathname === "/admin/login") return <>{children}</>;
  if (auth === null) return <div style={s.loading}>인증 확인 중...</div>;
  if (!auth) return null;

  return (
    <div style={s.layout}>
      <div style={s.topBar}>
        <a style={s.topLogo} href="/admin">📘 TQ Admin</a>
        <button style={s.topLogout} onClick={handleLogout}>로그아웃</button>
      </div>
      <div style={s.main}>{children}</div>
    </div>
  );
}
