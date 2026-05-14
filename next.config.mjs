import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 정적 파일은 모두 public/에서 자동 서빙됨.
  turbopack: {
    root: path.resolve("."),
  },
  // '/' 리다이렉트는 vercel.json에서 처리 (Next.js redirects보다 우선)
};

export default nextConfig;
