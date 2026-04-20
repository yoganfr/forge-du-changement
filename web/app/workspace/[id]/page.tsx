import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCachedWorkspace } from "@/lib/cache";

export const revalidate = 3600;
export const dynamicParams = true;

type WorkspacePageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: WorkspacePageProps): Promise<Metadata> {
  const { id } = await params;
  const workspace = await getCachedWorkspace(id);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  if (!workspace) {
    return {
      title: "Workspace introuvable",
      robots: { index: false, follow: false },
    };
  }

  const title = `${workspace.company_name} - La transformation : du discours à l'action`;
  const description = `Découvrez le parcours de transformation de ${workspace.company_name}. Projets transformants, roadmap maturity et pilotage du changement.`;
  const url = `${siteUrl}/workspace/${id}`;
  const ogImage =
    workspace.logo_url ||
    `${siteUrl}/images/og-default.png`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "La Forge du Changement",
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: workspace.company_name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
  };
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { id } = await params;
  const workspace = await getCachedWorkspace(id);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  if (!workspace) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: workspace.company_name,
    url: `${siteUrl}/workspace/${id}`,
    logo: workspace.logo_url,
    description: `Transformation de ${workspace.company_name}`,
  };

  return (
    <>
      <section className="bg-gradient-to-b from-slate-50 to-white py-10">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            La transformation : du discours a l&apos;action !
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            {workspace.company_name}
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Etape actuelle : {workspace.current_step} / 6
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            Parcours de transformation
          </h2>
          <p className="mt-3 text-slate-600">
            Timeline verticale a integrer ici (composant LandingTimeline).
          </p>

          <a
            href="https://forge-du-changement.vercel.app"
            className="mt-8 inline-block rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Acceder a mon espace
          </a>
        </div>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
