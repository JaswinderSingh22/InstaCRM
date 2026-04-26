import { requireWorkspace } from "@/lib/auth/workspace";
import { createClient } from "@/lib/supabase/server";
import { TemplateList } from "@/components/templates/template-editor";
import { PageFade } from "@/components/layout/page-fade";
import type { Template } from "@/types/database";

export const metadata = { title: "Templates" };

export default async function TemplatesPage() {
  const { workspaceId } = await requireWorkspace();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("name");
  if (error) {
    return <p className="text-destructive">Could not load</p>;
  }
  const items = (data ?? []) as Template[];
  return (
    <PageFade>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
        <p className="text-sm text-muted-foreground">Snippets for email, tasks, and notes</p>
      </div>
      {items.length === 0 && (
        <p className="mb-2 text-sm text-muted-foreground">No templates yet. Create your first below.</p>
      )}
      <TemplateList items={items} />
    </PageFade>
  );
}
