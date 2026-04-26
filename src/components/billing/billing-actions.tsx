"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useState } from "react";

type Props = {
  plan: string | null;
  status: string;
};

export function BillingActions({ plan, status }: Props) {
  const [load, setLoad] = useState<"c" | "p" | null>(null);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="border-border/60 bg-card/30">
        <CardHeader>
          <CardTitle className="text-base">Pro</CardTitle>
          <CardDescription>Full InstaCRM for your workspace</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-2xl font-semibold">$29<span className="text-sm text-muted-foreground">/mo</span></p>
          <Button
            className="w-full"
            onClick={async () => {
              setLoad("c");
              try {
                const r = await fetch("/api/stripe/checkout", { method: "POST" });
                const j = await r.json();
                if (!r.ok) throw new Error(j.error || "Request failed");
                if (j.url) window.location.href = j.url;
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Error");
              } finally {
                setLoad(null);
              }
            }}
            disabled={load !== null}
          >
            {load === "c" ? <Loader2 className="size-4 animate-spin" /> : "Start subscription"}
          </Button>
        </CardContent>
      </Card>
      <Card className="border-border/60 bg-card/30">
        <CardHeader>
          <CardTitle className="text-base">Manage billing</CardTitle>
          <CardDescription>Update card, view invoices, cancel</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="secondary"
            className="w-full"
            onClick={async () => {
              setLoad("p");
              try {
                const r = await fetch("/api/stripe/portal", { method: "POST" });
                const j = await r.json();
                if (!r.ok) throw new Error(j.error || "Request failed");
                if (j.url) window.location.href = j.url;
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Error");
              } finally {
                setLoad(null);
              }
            }}
            disabled={load !== null}
          >
            {load === "p" ? <Loader2 className="size-4 animate-spin" /> : "Open customer portal"}
          </Button>
        </CardContent>
      </Card>
      <p className="md:col-span-2 text-xs text-muted-foreground">
        Current: <span className="text-foreground">{status}</span> · Plan:{" "}
        <span className="text-foreground">{plan ?? "none"}</span>
      </p>
    </div>
  );
}
