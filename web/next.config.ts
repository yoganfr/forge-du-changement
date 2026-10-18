import { createHash } from "node:crypto";
import path from "path";
import type { NextConfig } from "next";
import { THEME_INIT_SCRIPT } from "./lib/themeInitScript";

const themeScriptHash = createHash("sha256")
  .update(THEME_INIT_SCRIPT, "utf8")
  .digest("base64");

const enforcingCsp = [
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
].join("; ");

const reportOnlyCsp = `script-src 'self' 'sha256-${themeScriptHash}'`;

const nextConfig: NextConfig = {
  turbopack: {
    // Keep Turbopack scoped to `web/` for predictable local dev behavior.
    root: path.resolve(__dirname),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: enforcingCsp },
          // TODO(CSP): passer script-src en bloquant après revue des violations
          // Report-Only sur preview. Butoir : 1 novembre 2026.
          { key: "Content-Security-Policy-Report-Only", value: reportOnlyCsp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
