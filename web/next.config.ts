import path from "path";
import type { NextConfig } from "next";

/*
 * Racine monorepo (parent de `web/`) : `app/globals.css` importe `../../src/themes.css`.
 * Avec `root: __dirname` sur `web/` seul, Turbopack exclut `src/` → erreurs dev (overlay getServerError).
 */
const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, ".."),
  },
};

export default nextConfig;
