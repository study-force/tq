/** @type {import('next').NextConfig} */
const nextConfig = {
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
