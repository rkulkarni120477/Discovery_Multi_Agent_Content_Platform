import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this app: a stray package-lock.json one level up (in the user's
  // home directory, which turned out to be an unrelated git repo root — see project README) would
  // otherwise make Next.js/Turbopack guess the wrong monorepo root.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
