/**
 * Edge Function : analyse IA du Discours (OpenRouter, modèle gpt-oss-120b).
 * Secrets : OPENROUTER_API_KEY (obligatoire), SUPABASE_URL + SUPABASE_ANON_KEY (injectés par la plateforme).
 *
 * POST JSON : { "workspaceId": "uuid", "text": "texte du discours (plat)" }
 * Auth : en-tête Authorization: Bearer <JWT session utilisateur> (défaut via invoke côté client).
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"
import { z } from "https://esm.sh/zod@3.24.1"

const MIN_CHARS = 400
const MODEL = "openai/gpt-oss-120b"
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
} as const

const AiDimensionsSchema = z.object({
  clarte_strategique: z.number().min(0).max(20),
  force_narrative: z.number().min(0).max(20),
  credibilite_manageriale: z.number().min(0).max(20),
  pouvoir_mobilisateur: z.number().min(0).max(20),
  performativite_collective: z.number().min(0).max(20),
})

const AiPayloadSchema = z.object({
  total: z.number().min(0).max(100),
  dimensions: AiDimensionsSchema,
  niveau: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  forces: z.array(z.string()).max(10),
  vigilances: z.array(z.string()).max(10),
  recommandations: z.array(z.string()).max(10),
  synthese: z.string().max(700).optional(),
  bloc_feedback: z
    .record(z.object({
      synthese: z.string().max(500).optional(),
      forces: z.array(z.string()).max(4).optional(),
      vigilances: z.array(z.string()).max(4).optional(),
      recommandations: z.array(z.string()).max(4).optional(),
    }))
    .optional(),
})

const BodySchema = z.object({
  workspaceId: z.string().uuid(),
  text: z.string().min(1),
  blocs: z.unknown().optional(),
  blocs_fingerprint: z.string().optional(),
})

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { ...cors } })
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Méthode non autorisée" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")
  const openrouterKey = Deno.env.get("OPENROUTER_API_KEY")

  if (!supabaseUrl || !supabaseAnon) {
    return new Response(
      JSON.stringify({ error: "Configuration Supabase manquante côté serveur" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    )
  }
  if (!openrouterKey) {
    return new Response(
      JSON.stringify({
        error: "Clé OpenRouter non configurée (secret OPENROUTER_API_KEY sur le projet Supabase).",
      }),
      { status: 503, headers: { ...cors, "Content-Type": "application/json" } },
    )
  }

  const authHeader = req.headers.get("Authorization")
  if (!authHeader?.toLowerCase().startsWith("bearer ")) {
    return new Response(JSON.stringify({ error: "Authentification requise" }), {
      status: 401,
      headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  const supabase = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: { user }, error: userErr } = await supabase.auth.getUser()
  if (userErr || !user) {
    return new Response(JSON.stringify({ error: "Session invalide ou expirée" }), {
      status: 401,
      headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: "Corps JSON invalide" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  const parsedBody = BodySchema.safeParse(json)
  if (!parsedBody.success) {
    return new Response(
      JSON.stringify({ error: "Requête invalide", details: parsedBody.error.flatten() }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } },
    )
  }
  const { workspaceId, text, blocs, blocs_fingerprint } = parsedBody.data
  const useful = text.replace(/\s/g, " ").trim()
  if (useful.length < MIN_CHARS) {
    return new Response(
      JSON.stringify({
        error: `Texte trop court pour une analyse fiable (minimum recommandé : ${MIN_CHARS} caractères utiles).`,
      }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } },
    )
  }

  const { data: profile, error: profErr } = await supabase
    .from("users")
    .select("workspace_id, is_platform_superadmin")
    .eq("id", user.id)
    .maybeSingle()

  if (profErr) {
    console.error("discours-analyze: users select", profErr)
    return new Response(JSON.stringify({ error: "Impossible de vérifier le profil" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    })
  }
  if (!profile) {
    return new Response(
      JSON.stringify({ error: "Profil utilisateur introuvable" }),
      { status: 403, headers: { ...cors, "Content-Type": "application/json" } },
    )
  }
  const isSuper = profile.is_platform_superadmin === true
  const sameWs = profile.workspace_id === workspaceId
  let allowed = isSuper || sameWs
  if (!allowed) {
    const { data: wc, error: wcErr } = await supabase
      .from("workspace_consultants")
      .select("id")
      .eq("user_id", user.id)
      .eq("workspace_id", workspaceId)
      .limit(1)
      .maybeSingle()
    if (wcErr) {
      console.error("discours-analyze: workspace_consultants", wcErr)
    }
    allowed = Boolean(wc)
  }
  if (!allowed) {
    return new Response(
      JSON.stringify({ error: "Accès refusé à cet espace entreprise" }),
      { status: 403, headers: { ...cors, "Content-Type": "application/json" } },
    )
  }

  const blocKeys = [
    "nous_reconnaitre",
    "nommer_la_bascule",
    "futur_desirable",
    "nouveaux_principes",
    "concentrer_efforts",
    "reconnaitre_epreuves",
    "distribuer_roles",
    "sceller_engagement",
  ] as const

  const system = `Tu es un expert en communication de direction et en conduite du changement.
Tu évalues un discours de transformation (CODIR) selon 5 dimensions (0–20 chacune) :
clarté stratégique, force narrative, crédibilité managériale, pouvoir mobilisateur, performativité collective.
Le total sur 100 doit être cohérent (approximation de la somme des 5 dimensions, chacune /20).
Niveau global (§3.3) : 1 = à retravailler, 2 = solide, 3 = transformant.

RÈGLES :
- Ne fabrique pas de faits : base-toi uniquement sur le texte fourni.
- Sois bref dans les listes (puces claires, françaises).
- Donne une synthèse exploitable dans l'en-tête, puis des retours ciblés par bloc.
- Pour bloc_feedback, utilise uniquement ces clés si le bloc contient assez de matière : ${blocKeys.join(", ")}.
- Réponds UNIQUEMENT par un JSON valide, sans markdown, avec exactement la structure :
{
  "total": number,
  "dimensions": {
    "clarte_strategique": number,
    "force_narrative": number,
    "credibilite_manageriale": number,
    "pouvoir_mobilisateur": number,
    "performativite_collective": number
  },
  "niveau": 1 | 2 | 3,
  "forces": string[],
  "vigilances": string[],
  "recommandations": string[],
  "synthese": string,
  "bloc_feedback": {
    "nous_reconnaitre": { "synthese": string, "forces": string[], "vigilances": string[], "recommandations": string[] },
    "...": { "synthese": string, "forces": string[], "vigilances": string[], "recommandations": string[] }
  }
}`

  const structuredBlocs =
    blocs === undefined
      ? ""
      : `\n\nPayload structuré par bloc (JSON, à privilégier pour les retours ciblés) :\n${JSON.stringify(blocs).slice(0, 80_000)}`

  const orRes = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${openrouterKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content:
            `Texte du discours à analyser (workspace connu) :\n\n${text.slice(0, 120_000)}${structuredBlocs}`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 4_000,
    }),
  })

  if (!orRes.ok) {
    const errText = await orRes.text()
    console.error("OpenRouter", orRes.status, errText)
    return new Response(
      JSON.stringify({ error: "Échec de l’analyse (OpenRouter). Réessayer plus tard." }),
      { status: 502, headers: { ...cors, "Content-Type": "application/json" } },
    )
  }

  const orJson: unknown = await orRes.json()
  const orModel = extractOpenRouterModel(orJson)
  if (orModel) {
    console.log("discours-analyze: OpenRouter model =", orModel, "| request =", MODEL)
  }
  const content = extractOpenRouterText(orJson)
  if (!content) {
    return new Response(JSON.stringify({ error: "Réponse modèle vide" }), {
      status: 502,
      headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  let rawJson: unknown
  try {
    rawJson = JSON.parse(content)
  } catch {
    return new Response(JSON.stringify({ error: "Le modèle n’a pas renvoyé un JSON valide" }), {
      status: 502,
      headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  const ai = AiPayloadSchema.safeParse(rawJson)
  if (!ai.success) {
    console.error("Zod", ai.error.flatten(), content.slice(0, 500))
    return new Response(
      JSON.stringify({ error: "Analyse reçue mais format inattendu. Réessayer." }),
      { status: 502, headers: { ...cors, "Content-Type": "application/json" } },
    )
  }

  const d = ai.data
  const sumDim =
    d.dimensions.clarte_strategique +
    d.dimensions.force_narrative +
    d.dimensions.credibilite_manageriale +
    d.dimensions.pouvoir_mobilisateur +
    d.dimensions.performativite_collective
  if (Math.abs(d.total - sumDim) > 8) {
    console.warn("discours-analyze: écart total vs somme dimensions", d.total, sumDim)
  }

  const out = {
    total: d.total,
    dimensions: d.dimensions,
    niveau: d.niveau,
    forces: d.forces,
    vigilances: d.vigilances,
    recommandations: d.recommandations,
    synthese: d.synthese,
    bloc_feedback: d.bloc_feedback,
    source: "ai" as const,
    computed_at: new Date().toISOString(),
    model_requested: MODEL,
    openrouter_model: orModel,
    blocs_fingerprint,
  }

  return new Response(JSON.stringify(out), {
    status: 200,
    headers: { ...cors, "Content-Type": "application/json" },
  })
})

function extractOpenRouterText(body: unknown): string | null {
  if (typeof body !== "object" || body === null) return null
  const b = body as { choices?: Array<{ message?: { content?: string } }> }
  const c = b.choices?.[0]?.message?.content
  return typeof c === "string" && c.length > 0 ? c : null
}

function extractOpenRouterModel(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null) return undefined
  const m = (body as { model?: string }).model
  return typeof m === "string" && m.length > 0 ? m : undefined
}
