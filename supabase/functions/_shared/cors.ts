const ALLOWED_ORIGINS = [
  "https://forge-du-changement.vercel.app",
  "https://forge-du-changement-kgyg-xi.vercel.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]

/** En-têtes pour une fonction appelée par le navigateur. Une origine inconnue n'est pas renvoyée. */
export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? ""
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  }
  if (ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin
  }
  return headers
}
