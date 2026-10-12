import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  // ── Phase 1: Compiler & Package-Import Optimizations ─────────────────────
  experimental: {
    /**
     * Tree-shake heavy icon, UI, animation, and virtualization libraries at the package level
     * so Turbopack & Webpack only emit and compile the specific exports imported.
     */
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@tanstack/react-virtual",
    ],
  },

  // ── Compiler optimizations ───────────────────────────────────────────────
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },

  // ── Image optimization ────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "yt3.ggpht.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },
};

export default withBundleAnalyzer(nextConfig);
