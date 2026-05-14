import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 정적 파일은 모두 public/에서 자동 서빙됨.
  turbopack: {
    root: path.resolve("."),
  },
  // 루트 접속 시 응시 페이지로 리다이렉트 (기존 index.html meta refresh 대체)
  async redirects() {
    return [
      {
        source: "/",
        destination: "/tq_v5_prod.html",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
