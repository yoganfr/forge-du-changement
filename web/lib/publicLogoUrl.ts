/**
 * Logo publiable sur une fiche workspace : https uniquement,
 * et seulement si l'hôte est celui du projet Supabase.
 */
export function publicLogoUrl(
  logoUrl: string | null | undefined,
  siteUrl: string,
  supabaseUrl: string | undefined,
): string {
  const fallback = `${siteUrl.replace(/\/$/, "")}/images/og-default.png`;
  if (!logoUrl || !supabaseUrl) return fallback;

  try {
    const logo = new URL(logoUrl);
    const supabase = new URL(supabaseUrl);
    if (logo.protocol !== "https:" || logo.hostname !== supabase.hostname) {
      return fallback;
    }
    return logo.toString();
  } catch {
    return fallback;
  }
}
