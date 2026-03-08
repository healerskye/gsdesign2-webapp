/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return [];
    return [{ source: "/api/gsdesign2/:path*", destination: `${apiUrl}/:path*` }];
  },
};
export default nextConfig;
