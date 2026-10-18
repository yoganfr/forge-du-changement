import "server-only";
import { cache } from "react";
import { supabaseAdmin } from "./supabase";

export type Workspace = {
  id: string;
  company_name: string;
  current_step_codir: number | null;
  logo_url: string | null;
  updated_at: string;
};

export const getCachedWorkspace = cache(
  async (id: string): Promise<Workspace | null> => {
    const { data, error } = await supabaseAdmin
      .from("workspaces")
      .select("id, company_name, current_step_codir, logo_url, updated_at")
      .eq("id", id)
      .eq("archived", false)
      .eq("is_showcase", true)
      .maybeSingle();

    if (error) {
      console.error("getCachedWorkspace", error.code, error.message);
      return null;
    }
    return data;
  }
);
