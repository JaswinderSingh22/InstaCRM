-- Sample contacts + activity (only for workspaces with brands but no rows in these tables yet).

INSERT INTO public.brand_contacts (
  workspace_id, brand_id, name, email, role, status, last_contacted_at
)
SELECT
  fb.workspace_id,
  fb.id,
  c.name,
  c.email,
  c.role,
  c.status,
  c.last_at
FROM (
  SELECT
    b.id,
    b.workspace_id,
    row_number() OVER (PARTITION BY b.workspace_id ORDER BY b.created_at) AS ord
  FROM public.brands b
) fb
CROSS JOIN (
  VALUES
    (1, 'Sarah Miller', 'sarah@lumina.com', 'Marketing Lead', 'active', NOW() - interval '1 day'),
    (2, 'James Chen', 'j.chen@evergreen.com', 'Sustainability Dir.', 'active', NOW() - interval '3 days'),
    (3, 'Robert Jordan', 'rob@peakathletics.com', 'Talent Scout', 'pending', NOW() - interval '7 days')
) AS c(ord, name, email, role, status, last_at)
INNER JOIN (
  SELECT wb.workspace_id
  FROM (SELECT DISTINCT workspace_id FROM public.brands) wb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.brand_contacts x WHERE x.workspace_id = wb.workspace_id
  )
) w ON w.workspace_id = fb.workspace_id
WHERE fb.ord = c.ord
  AND fb.ord <= 3;

INSERT INTO public.brand_activities (
  workspace_id, brand_id, kind, title, body, amount_cents, occurred_at
)
SELECT
  fb.workspace_id,
  fb.id,
  a.kind,
  a.title,
  a.body,
  a.amount,
  a.occ
FROM (
  SELECT
    b.id,
    b.workspace_id,
    row_number() OVER (PARTITION BY b.workspace_id ORDER BY b.created_at) AS ord
  FROM public.brands b
) fb
CROSS JOIN (
  VALUES
    (
      1,
      'email'::text,
      'Email sent to Lumina Skincare',
      'Proposal for Winter Refresh campaign submitted for review.',
      NULL::bigint,
      (NOW() - interval '1 hour')
    ),
    (
      2,
      'payment',
      'Payment received',
      '$4,200 payout from Evergreen Eco for September deliverables.',
      420000::bigint,
      (NOW() - interval '1 day 4 hours')
    ),
    (
      3,
      'contract',
      'Contract signed',
      'Peak Athletics initial sponsorship deal finalized and signed.',
      NULL::bigint,
      (NOW() - interval '5 days')
    )
) AS a(ord, kind, title, body, amount, occ)
INNER JOIN (
  SELECT wb.workspace_id
  FROM (SELECT DISTINCT workspace_id FROM public.brands) wb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.brand_activities y WHERE y.workspace_id = wb.workspace_id
  )
) w ON w.workspace_id = fb.workspace_id
WHERE fb.ord = a.ord
  AND fb.ord <= 3;
