import type { MetadataRoute } from "next";
import { supabaseAdmin } from "@/lib/supabase";

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const baseUrl = siteUrl;

  const { data: workspaces } = await supabaseAdmin
    .from("workspaces")
    .select("id, updated_at")
    .eq("archived", false)
    .eq("is_public", true);

  const workspaceUrls = (workspaces || []).map((ws) => ({
    url: `${baseUrl}/workspace/${ws.id}`,
    lastModified: new Date(ws.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 1,
    },
    ...workspaceUrls,
  ];
}
