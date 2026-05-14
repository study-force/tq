// 루트 페이지 — vercel.json의 redirect가 먼저 처리되므로 거의 도달하지 않음.
// 다만 Next.js 라우팅 매니페스트 완전성을 위해 존재.
export const metadata = {
  title: "TQ TEST",
};

export default function RootPage() {
  return (
    <>
      <meta httpEquiv="refresh" content="0;url=/tq_v5_prod.html" />
      <p style={{ padding: 20, fontFamily: "sans-serif" }}>
        이동 중... <a href="/tq_v5_prod.html">클릭</a>
      </p>
    </>
  );
}
