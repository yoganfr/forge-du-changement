/**
 * Après retrait membre côté app (RLS), supprime le compte Supabase Auth si l’email
 * n’a plus aucune ligne `public.users` ni invitation `en_attente` / `acceptee`.
 *
 * POST JSON : { "workspace_id": "uuid", "email": "x@y.z" }
 * Auth : Authorization: Bearer <JWT session> (verify_jwt côté plateforme).
 * Secret : SUPABASE_SERVICE_ROLE_KEY (injecté sur le projet hébergé).
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.3"
import { z } from "https://esm.sh/zod@3.24.1"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
} as const

const BodySchema = z.object({
  workspace_id: z.string().uuid(),
  email: z.string().min(3).max(320),
})

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase()
}

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
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

  if (!supabaseUrl || !supabaseAnon) {
    return new Response(
      JSON.stringify({ error: "Configuration Supabase manquante" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    )
  }
  if (!serviceRole) {
    return new Response(
      JSON.stringify({
        error: "SUPABASE_SERVICE_ROLE_KEY manquant pour cette fonction (secret projet).",
      }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    )
  }

  const authHeader = req.headers.get("Authorization")
  if (!authHeader?.toLowerCase().startsWith("bearer ")) {
    return new Response(JSON.stringify({ error: "Authentification requise" }), {
      status: 401,
      headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  const userClient = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: { user }, error: userErr } = await userClient.auth.getUser()
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

  const parsed = BodySchema.safeParse(json)
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Requête invalide", details: parsed.error.flatten() }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } },
    )
  }

  const workspaceId = parsed.data.workspace_id
  const emailNorm = normalizeEmail(parsed.data.email)

  const { data: canManage, error: rpcErr } = await userClient.rpc("can_manage_workspace", {
    _workspace_id: workspaceId,
  })

  if (rpcErr) {
    console.error("remove-member-auth-cleanup: rpc can_manage_workspace", rpcErr)
    return new Response(JSON.stringify({ error: "Impossible de vérifier les droits" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  if (canManage !== true) {
    return new Response(JSON.stringify({ error: "Accès refusé pour cet espace" }), {
      status: 403,
      headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  const adminDb = createClient(supabaseUrl, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { count: userCount, error: uErr } = await adminDb
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("email", emailNorm)

  if (uErr) {
    console.error("remove-member-auth-cleanup: count users", uErr)
    return new Response(JSON.stringify({ error: "Lecture base impossible" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  const { count: invCount, error: invErr } = await adminDb
    .from("invitations")
    .select("id", { count: "exact", head: true })
    .eq("email", emailNorm)
    .in("status", ["en_attente", "acceptee"])

  if (invErr) {
    console.error("remove-member-auth-cleanup: count invitations", invErr)
    return new Response(JSON.stringify({ error: "Lecture base impossible" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  if ((userCount ?? 0) > 0 || (invCount ?? 0) > 0) {
    return new Response(
      JSON.stringify({
        ok: true,
        skipped: "still_has_app_presence",
        users: userCount ?? 0,
        invitations: invCount ?? 0,
      }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } },
    )
  }

  const adminAuth = createClient(supabaseUrl, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  let authUserId: string | null = null
  for (let page = 1; page <= 25; page++) {
    const { data: pageData, error: listErr } = await adminAuth.auth.admin.listUsers({
      page,
      perPage: 200,
    })
    if (listErr) {
      console.error("remove-member-auth-cleanup: listUsers", listErr)
      return new Response(JSON.stringify({ error: "Lecture Auth impossible" }), {
        status: 502,
        headers: { ...cors, "Content-Type": "application/json" },
      })
    }
    const hit = pageData.users.find((u) => (u.email ?? "").trim().toLowerCase() === emailNorm)
    if (hit) {
      authUserId = hit.id
      break
    }
    if (pageData.users.length < 200) break
  }

  if (!authUserId) {
    return new Response(
      JSON.stringify({ ok: true, skipped: "no_auth_user" }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } },
    )
  }

  const { error: delErr } = await adminAuth.auth.admin.deleteUser(authUserId)
  if (delErr) {
    console.error("remove-member-auth-cleanup: deleteUser", delErr)
    return new Response(JSON.stringify({ error: "Suppression Auth impossible" }), {
      status: 502,
      headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  return new Response(
    JSON.stringify({ ok: true, auth_deleted: true, auth_user_id: authUserId }),
    { status: 200, headers: { ...cors, "Content-Type": "application/json" } },
  )
})
