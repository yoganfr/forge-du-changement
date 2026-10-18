import type { MetadataRoute } from "next";
import { supabaseAdmin } from "@/lib/supabase";

export const revalidate = 300;

const CI_PLACEHOLDER_SUPABASE_URL = "https://example.supabase.co";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const baseUrl = siteUrl;
  const homeEntry: MetadataRoute.Sitemap[number] = {
    url: baseUrl,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 1,
  };

  // Le contrôle GitHub n'a pas les accès réels : il ne liste pas les espaces publics.
  // En production, un échec de lecture doit encore faire échouer la génération.
  if ((process.env.SUPABASE_URL ?? "") === CI_PLACEHOLDER_SUPABASE_URL) {
    return [homeEntry];
  }

  const { data: workspaces, error } = await supabaseAdmin
    .from("workspaces")
    .select("id, updated_at")
    .eq("archived", false)
    .eq("is_showcase", true);

  if (error) {
    console.error("sitemap workspaces", error.code, error.message);
    throw new Error("Impossible de générer le sitemap des workspaces publics");
  }

  const workspaceUrls = (workspaces || []).map((ws) => ({
    url: `${baseUrl}/workspace/${ws.id}`,
    lastModified: new Date(ws.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [homeEntry, ...workspaceUrls];
}
