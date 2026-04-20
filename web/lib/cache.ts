import { cache } from "react";
import { supabaseAdmin } from "./supabase";

export type Workspace = {
  id: string;
  company_name: string;
  current_step: number;
  logo_url: string | null;
  updated_at: string;
};

export const getCachedWorkspace = cache(
  async (id: string): Promise<Workspace | null> => {
    const { data, error } = await supabaseAdmin
      .from("workspaces")
      .select("id, company_name, current_step, logo_url, updated_at")
      .eq("id", id)
      .eq("archived", false)
      .eq("is_public", true)
      .single();

    if (error) return null;
    return data;
  }
);
