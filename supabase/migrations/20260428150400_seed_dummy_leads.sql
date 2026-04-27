-- Demo leads: sample rows per workspace that has none yet.
-- Notes use the same shape as the app (Priority + Estimated budget) so the Leads UI metrics and columns populate.

WITH empty_workspaces AS (
  SELECT w.id
  FROM public.workspaces w
  WHERE NOT EXISTS (SELECT 1 FROM public.leads l WHERE l.workspace_id = w.id)
),
seed AS (
  SELECT *
  FROM (
    VALUES
      (
        'Sarah Chen',
        'sarah.chen@glowskin.co',
        'GlowSkin Co.',
        'contacted'::text,
        'Instagram DM'::text,
        $n$Priority: HIGH
Estimated budget: $12,000.00$n$::text
      ),
      (
        'James Park',
        'james@techstream.example',
        'TechStream Inc.',
        'qualified',
        'Website',
        $n$Priority: MED
Estimated budget: $45,000.00$n$::text
      ),
      (
        'Maria Lopez',
        'maria.lopez@pulsefit.example',
        'Pulse Fitness',
        'new',
        'Referral',
        $n$Priority: LOW
Estimated budget: $8,500.00$n$::text
      ),
      (
        'Alex Kim',
        'alex@brewbean.example',
        'Brew & Bean',
        'contacted',
        'Email',
        $n$Priority: MED
Estimated budget: $15,750.00$n$::text
      ),
      (
        'Taylor Reed',
        't.reed@lumina-skincare.example',
        'Lumina Skincare',
        'qualified',
        'TikTok',
        $n$Priority: HIGH
Estimated budget: $22,400.00$n$::text
      ),
      (
        'Jordan Hayes',
        'jordan@evergreen-eco.example',
        'Evergreen Eco',
        'lost',
        'Event',
        $n$Priority: LOW
Estimated budget: $3,200.00$n$::text
      ),
      (
        'Casey Morgan',
        'casey@peakathletics.example',
        'Peak Athletics',
        'new',
        'Inbound form',
        $n$Priority: MED
Estimated budget: $18,000.00$n$::text
      ),
      (
        'Riley Nova',
        'riley@northwind-media.example',
        'Northwind Media',
        'contacted',
        'Direct DM',
        $n$Priority: HIGH
Estimated budget: $31,250.00$n$::text
      ),
      (
        'Sam Wilson',
        'sam@artisan-coffee.example',
        'Artisan Coffee Co.',
        'qualified',
        'Referral',
        $n$Priority: MED
Estimated budget: $9,800.00$n$::text
      ),
      (
        'Drew Martinez',
        'drew@fitlife-apparel.example',
        'FitLife Apparel',
        'contacted',
        'Instagram DM',
        $n$Priority: HIGH
Estimated budget: $67,000.00$n$::text
      ),
      (
        'Priya Shah',
        'priya@minimal-goods.example',
        'Minimal Goods',
        'new',
        'TikTok',
        $n$Priority: LOW
Estimated budget: $5,400.00$n$::text
      ),
      (
        'Chris Olsen',
        'chris@wave-audio.example',
        'Wave Audio',
        'qualified',
        'Email',
        $n$Priority: MED
Estimated budget: $28,900.00$n$::text
      )
  ) AS v(name, email, company, status, source, notes)
)
INSERT INTO public.leads (
  workspace_id,
  name,
  email,
  phone,
  company,
  status,
  source,
  notes
)
SELECT
  w.id,
  s.name,
  s.email,
  NULL::text,
  s.company,
  s.status,
  s.source,
  s.notes
FROM empty_workspaces w
CROSS JOIN seed s;
