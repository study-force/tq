"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

const s = {
  wrapper: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F1F5F9", fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif" },
  card: { background: "#fff", borderRadius: 16, padding: "48px 40px", width: 380, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", textAlign: "center" },
  title: { fontSize: 22, fontWeight: 700, marginBottom: 8, color: "#1E293B" },
  subtitle: { fontSize: 14, color: "#64748B", marginBottom: 32 },
  input: { width: "100%", padding: "12px 16px", fontSize: 15, border: "1px solid #D1D5DB", borderRadius: 10, outline: "none", boxSizing: "border-box", marginBottom: 16 },
  btn: (loading) => ({
    width: "100%", padding: "13px 0", fontSize: 15, fontWeight: 600, color: "#fff",
    background: loading ? "#94A3B8" : "#8B5CF6", border: "none", borderRadius: 10,
    cursor: loading ? "not-allowed" : "pointer", transition: "background 0.15s",
  }),
  error: { color: "#EF4444", fontSize: 13, marginTop: 12 },
};

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.replace("/admin");
      } else {
        const d = await res.json();
        setError(d.error || "로그인 실패");
      }
    } catch {
      setError("네트워크 오류");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.wrapper}>
      <form style={s.card} onSubmit={handleSubmit}>
        <div style={s.title}>📘 TQ 어드민</div>
        <div style={s.subtitle}>독해 역량 분석 시스템 관리</div>
        <input
          style={s.input}
          type="password"
          placeholder="관리자 비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        <button style={s.btn(loading)} type="submit" disabled={loading}>
          {loading ? "확인 중..." : "로그인"}
        </button>
        {error && <div style={s.error}>{error}</div>}
      </form>
    </div>
  );
}
