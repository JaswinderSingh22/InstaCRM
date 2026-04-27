"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBrand, deleteBrand } from "@/app/actions/crm";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Brand } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus } from "lucide-react";

export function BrandForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button
        id="add-brand-btn"
        size="sm"
        type="button"
        onClick={() => setOpen(true)}
        className="h-9 gap-1.5 rounded-lg border-0 bg-gradient-to-r from-[#4F46E5] to-indigo-600 font-semibold text-white shadow-sm hover:from-[#4338ca] hover:to-indigo-600"
      >
        <Plus className="size-3.5" />
        Add brand
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md border-neutral-200 bg-white" showCloseButton>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-neutral-900">Add brand</DialogTitle>
            <DialogDescription>Create a brand profile for partnerships and activity.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              setLoading(true);
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
                (e.target as HTMLFormElement).reset();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Error");
              } finally {
                setLoading(false);
              }
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="bname">Name *</Label>
              <Input id="bname" name="name" required className="h-10 rounded-lg border-neutral-200 bg-[#F8F9FC]" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site">Website</Label>
              <Input
                id="site"
                name="website"
                type="url"
                placeholder="https://"
                className="h-10 rounded-lg border-neutral-200 bg-[#F8F9FC]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ind">Industry</Label>
              <Input id="ind" name="industry" className="h-10 rounded-lg border-neutral-200 bg-[#F8F9FC]" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="col">Color (hex)</Label>
              <Input
                id="col"
                name="color"
                placeholder="#6366f1"
                className="h-10 rounded-lg border-neutral-200 bg-[#F8F9FC]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-[#4F46E5] to-indigo-600 text-white"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
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
