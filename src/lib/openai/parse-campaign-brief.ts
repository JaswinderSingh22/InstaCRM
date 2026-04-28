import { z } from "zod";
import { normalizeWorkspaceCurrency } from "@/lib/currency";

const ParsedBriefSchema = z.object({
  title: z.string(),
  brand_name: z.string().nullable().optional(),
  agency_name: z.string().nullable().optional(),
  compensation_summary: z.string().nullable().optional(),
  compensation_cents: z.number().int().nullable().optional(),
  compensation_type: z.enum(["cash", "barter", "mixed", "unknown"]).optional(),
  deliverables: z.array(z.string()).optional(),
  shoot_date: z.string().nullable().optional(),
  post_date: z.string().nullable().optional(),
  post_date_end: z.string().nullable().optional(),
  apply_url: z.string().nullable().optional(),
  location_notes: z.string().nullable().optional(),
  requirements_notes: z.string().nullable().optional(),
});

export type ParsedCampaignBrief = z.infer<typeof ParsedBriefSchema>;

const SYSTEM = `You extract structured data from influencer/creator campaign briefs (WhatsApp, email, forms).
Return a single JSON object with these keys only:
- title: short campaign name (e.g. "Max Fashion — GRWM reel")
- brand_name: brand being promoted, or null
- agency_name: agency or network (e.g. SnackMedia), or null
- compensation_summary: human-readable pay/perk line (e.g. "₹2,200 per creator" or "Kit worth up to ₹1,000")
- compensation_cents: integer in smallest units — INR paise (₹1000 → 100000), USD cents. Set whenever ANY clear amount appears for fees OR product/kit/sample value, including phrases like "worth up to ₹1000", "Total kit worth Rs 1000", "$100 product stipend". If several numbers exist, prefer the headline total perk/kit/campaign value when the brief is mostly product barter.
- compensation_type: "cash" for fees/honorarium; "barter" when mainly product/kits/samples (even when valued in ₹ or $); "mixed" if both fee and product; "unknown" only if unclear
- deliverables: string array (e.g. "1 Instagram Collab Reel", "1 Story")
- shoot_date: "YYYY-MM-DD" or null
- post_date: "YYYY-MM-DD" or null (first mandatory post day if range given)
- post_date_end: "YYYY-MM-DD" or null (end of post window)
- apply_url: full https URL if present, else null
- location_notes: city/region constraints in one line, or null
- requirements_notes: important rules (timeline, followers, no backouts) condensed under 400 chars, or null

Examples: ₹2,200 fee → compensation_cents 220000. "Kit worth up to ₹1000" → barter, compensation_cents 100000.
Dates: parse "1st May", "May 2"; if year missing use ${new Date().getFullYear()}.`;

function parseMainUnitsFromAmountString(s: string): number | null {
  const t = s.replace(/,/g, "").trim();
  if (!t) return null;
  const n = parseFloat(t);
  if (Number.isNaN(n) || n <= 0) return null;
  return n;
}

/** Fallback when AI omits cents: scan for ₹/$ amounts (kit worth, Rs, INR, etc.). */
export function inferCompensationFromRawText(
  rawText: string,
  workspaceCurrency: string,
): { smallestUnits: number; suggestType: "cash" | "barter" | "mixed" } | null {
  const cur = normalizeWorkspaceCurrency(workspaceCurrency);
  const text = rawText;
  const lower = text.toLowerCase();

  if (cur === "INR") {
    const amounts: number[] = [];
    const patterns = [
      /(?:₹|Rs\.?\s*|INR\s*)([\d,]+(?:\.\d{1,2})?)/gi,
      /worth\s+(?:up\s+to\s+)?(?:₹|Rs\.?\s*|INR\s*)?\s*([\d,]+(?:\.\d{1,2})?)/gi,
      /(?:kit\s+worth|total\s+kit|value\s+(?:of|upto)|valued\s+at)\s+(?:up\s+to\s+)?(?:₹|Rs\.?\s*)?\s*([\d,]+(?:\.\d{1,2})?)/gi,
    ];
    for (const rx of patterns) {
      rx.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = rx.exec(text)) !== null) {
        const v = parseMainUnitsFromAmountString(m[1] ?? "");
        if (v != null) amounts.push(v);
      }
    }
    if (amounts.length === 0) return null;
    const maxRupee = Math.max(...amounts);
    const smallest = Math.round(maxRupee * 100);

    const productHeavy =
      /worth|kit|product|complimentary|barter|sample|sku|pack|soap/i.test(lower) ||
      /total\s+kit/i.test(lower);
    const feeHeavy =
      /(?:per\s+)?(?:creator|post|reel|story|collab)\b/i.test(lower) &&
      /(?:flat|fee|honorarium|₹|rs\.?|inr)/i.test(lower);

    const suggestType: "cash" | "barter" | "mixed" = feeHeavy && !productHeavy ? "cash" : "barter";

    return { smallestUnits: smallest, suggestType };
  }

  if (cur === "USD") {
    const amounts: number[] = [];
    const rx = /\$\s*([\d,]+(?:\.\d{1,2})?)/g;
    let m: RegExpExecArray | null;
    while ((m = rx.exec(text)) !== null) {
      const v = parseMainUnitsFromAmountString(m[1] ?? "");
      if (v != null) amounts.push(v);
    }
    if (amounts.length === 0) return null;
    const maxUsd = Math.max(...amounts);
    const cents = Math.round(maxUsd * 100);
    const productHeavy = /worth|kit|product|complimentary|barter|sample/i.test(lower);
    return { smallestUnits: cents, suggestType: productHeavy ? "barter" : "cash" };
  }

  return null;
}

export function enrichParsedBriefWithHeuristics(
  rawText: string,
  parsed: ParsedCampaignBrief,
  workspaceCurrency: string,
): ParsedCampaignBrief {
  const inferred = inferCompensationFromRawText(rawText, workspaceCurrency);

  let compensation_cents = parsed.compensation_cents ?? null;
  let compensation_summary = parsed.compensation_summary ?? null;
  let compensation_type = parsed.compensation_type ?? "unknown";

  if (inferred && inferred.smallestUnits > 0) {
    if (compensation_cents == null || compensation_cents <= 0) {
      compensation_cents = inferred.smallestUnits;
    }
    if (!compensation_summary?.trim()) {
      const cur = normalizeWorkspaceCurrency(workspaceCurrency);
      const main = inferred.smallestUnits / 100;
      if (cur === "INR") {
        compensation_summary = `Kit / product value up to ₹${main.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
      } else {
        compensation_summary = `Value up to $${main.toFixed(2)}`;
      }
    }
    if (compensation_type === "unknown") {
      compensation_type = inferred.suggestType;
    }
  }

  return {
    ...parsed,
    compensation_cents,
    compensation_summary,
    compensation_type,
    deliverables: parsed.deliverables ?? [],
  };
}

export async function parseCampaignBriefWithOpenAI(rawText: string): Promise<ParsedCampaignBrief> {
  const key = process.env.OPENAI_API_KEY;
  if (!key?.trim()) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const text = rawText.trim().slice(0, 14_000);
  if (!text) {
    throw new Error("Paste a brief first");
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `Extract from this brief:\n\n${text}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from AI");
  }

  let json: unknown;
  try {
    json = JSON.parse(content);
  } catch {
    throw new Error("AI returned invalid JSON");
  }

  const parsed = ParsedBriefSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Could not validate AI output");
  }

  return {
    ...parsed.data,
    deliverables: parsed.data.deliverables ?? [],
    compensation_type: parsed.data.compensation_type ?? "unknown",
  };
}
