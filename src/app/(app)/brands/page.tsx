import { Suspense } from "react";
import { requireWorkspace } from "@/lib/auth/workspace";
import { getBrandsPageData } from "@/lib/data/brands-page";
import { BrandsPartnershipsView } from "@/components/brands/brands-partnerships-view";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata = { title: "Brands" };

type Props = { searchParams: Promise<{ q?: string }> };

function Loading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse space-y-4 p-1">
      <div className="h-8 w-72 rounded bg-neutral-200" />
      <div className="grid grid-cols-3 gap-3">
        <div className="h-48 rounded-2xl bg-neutral-100" />
        <div className="h-48 rounded-2xl bg-neutral-100" />
        <div className="h-48 rounded-2xl bg-neutral-100" />
      </div>
    </div>
  );
}

export default async function BrandsPage({ searchParams }: Props) {
  const p = await searchParams;
  const initialQuery = typeof p.q === "string" ? p.q : "";
  const { workspaceId, profile } = await requireWorkspace();
  const data = await getBrandsPageData(workspaceId);

  return (
    <Suspense fallback={<Loading />}>
      <BrandsPartnershipsView
        brandRows={data.brands}
        contacts={data.contacts}
        activities={data.activities}
        brandNameById={data.brandNameById}
        initialQuery={initialQuery}
        workspaceDefaultCurrency={profile.workspace_default_currency}
      />
    </Suspense>
  );
}
