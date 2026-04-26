"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBrand, deleteBrand } from "@/app/actions/crm";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Brand } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function BrandForm() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  if (!open) {
    return (
      <Button size="sm" className="rounded-md" onClick={() => setOpen(true)}>
        New brand
      </Button>
    );
  }
  return (
    <form
      className="mb-4 flex max-w-md flex-col gap-2 rounded-md border border-border/60 bg-card/30 p-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        try {
          await createBrand({
            name: String(fd.get("name")),
            website: String(fd.get("website") || undefined),
            industry: String(fd.get("industry") || undefined),
            color: String(fd.get("color") || undefined),
          });
          setOpen(false);
          toast.success("Created");
          router.refresh();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Error");
        }
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="bname">Name *</Label>
        <Input id="bname" name="name" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="site">Website</Label>
        <Input id="site" name="website" type="url" placeholder="https://" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ind">Industry</Label>
        <Input id="ind" name="industry" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="col">Color (hex)</Label>
        <Input id="col" name="color" placeholder="#6366f1" />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm">
          Save
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function BrandCards({ brands }: { brands: Brand[] }) {
  const router = useRouter();
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {brands.map((b) => (
        <Card key={b.id} className="border-border/60 bg-card/40">
          <CardHeader
            className="space-y-0 pb-2"
            style={b.color ? { borderTop: `3px solid ${b.color}` } : undefined}
          >
            <CardTitle className="text-base">{b.name}</CardTitle>
            {b.website ? (
              <a
                href={b.website}
                className="text-xs text-primary hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                {b.website}
              </a>
            ) : null}
            {b.industry ? <p className="text-xs text-muted-foreground">{b.industry}</p> : null}
          </CardHeader>
          <CardContent>
            {b.description ? <p className="text-sm text-muted-foreground">{b.description}</p> : null}
            <div className="mt-2 flex justify-end">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-destructive"
                onClick={async () => {
                  if (!confirm("Delete?")) return;
                  try {
                    await deleteBrand(b.id);
                    toast.success("Removed");
                    router.refresh();
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Error");
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
