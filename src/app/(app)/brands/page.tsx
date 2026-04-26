import { requireWorkspace } from "@/lib/auth/workspace";
import { createClient } from "@/lib/supabase/server";
import { BrandForm, BrandCards } from "@/components/brands/brand-form";
import { PageFade } from "@/components/layout/page-fade";
import type { Brand } from "@/types/database";

export const metadata = { title: "Brands" };

export default async function BrandsPage() {
  const { workspaceId } = await requireWorkspace();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("name");
  if (error) {
    return <p className="text-destructive">Could not load brands</p>;
  }
  const brands = (data ?? []) as Brand[];
  return (
    <PageFade>
      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Brands</h1>
          <p className="text-sm text-muted-foreground">Accounts & verticals you sell into</p>
        </div>
        <BrandForm />
      </div>
      {brands.length === 0 ? (
        <p className="text-sm text-muted-foreground">No brands yet</p>
      ) : (
        <BrandCards brands={brands} />
      )}
    </PageFade>
  );
}
