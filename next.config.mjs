import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 정적 파일은 모두 public/에서 자동 서빙됨.
  turbopack: {
    // 부모 디렉터리에 다른 lockfile이 있어서 workspace root 추정이 흔들리는 것 방지
    root: path.resolve("."),
  },
};

export default nextConfig;
