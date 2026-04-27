import { z } from "zod";

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
- compensation_summary: human-readable pay/perk line (e.g. "₹2,200 per creator" or "Product kit worth ₹1000")
- compensation_cents: integer total in smallest currency units (paise for INR, cents for USD) if clearly stated as a single number; else null
- compensation_type: "cash" | "barter" | "mixed" | "unknown"
- deliverables: string array (e.g. "1 Instagram Collab Reel", "1 Story")
- shoot_date: "YYYY-MM-DD" or null
- post_date: "YYYY-MM-DD" or null (first mandatory post day if range given)
- post_date_end: "YYYY-MM-DD" or null (end of post window)
- apply_url: full https URL if present, else null
- location_notes: city/region constraints in one line, or null
- requirements_notes: important rules (timeline, followers, no backouts) condensed under 400 chars, or null

If rupees are given as ₹2,200 use compensation_cents 220000 (INR paise). If only product value, set compensation_type barter and compensation_cents null unless a rupee value is given for the kit.
Dates: parse "1st May", "May 2" using the current year implied by context; if year missing use ${new Date().getFullYear()}.`;

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
