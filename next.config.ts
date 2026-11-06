import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL) : null;
const isLocalSupabase = supabaseUrl ? ["localhost", "127.0.0.1"].includes(supabaseUrl.hostname) : false;

const nextConfig: NextConfig = {
  // A stray lockfile on the Desktop must not be mistaken for this project's root.
  turbopack: { root: process.cwd() },
  images: {
    // Required by Next 16. Portfolio artwork is served at 85; the full-screen viewer uses 90.
    qualities: [75, 85, 90],
    // Files uploaded through the CMS are served from Supabase Storage.
    remotePatterns: supabaseUrl
      ? [
          {
            protocol: supabaseUrl.protocol === "http:" ? "http" : "https",
            hostname: supabaseUrl.hostname,
            port: supabaseUrl.port,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
    // Only for a Supabase running on this machine. Never true for a hosted project.
    dangerouslyAllowLocalIP: isLocalSupabase,
  },
  async headers() {
    return [
      {
        // The dashboard must never be embedded in another site or kept in a shared cache.
        source: "/admin/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
