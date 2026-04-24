import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Keep Turbopack scoped to `web/` for predictable local dev behavior.
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
