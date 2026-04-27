-- Demo payments: four sample rows per workspace that has no payments yet.
-- Relative due dates so the list stays current in any year.

WITH empty_workspaces AS (
  SELECT w.id
  FROM public.workspaces w
  WHERE NOT EXISTS (SELECT 1 FROM public.payments p WHERE p.workspace_id = w.id)
),
seed AS (
  SELECT * FROM (VALUES
    (1, 'TechStream Inc.', 250000::bigint, 'overdue'::text, 'Q4 Software Review Video'::text, (CURRENT_DATE - 20)::date, NULL::timestamptz),
    (2, 'GlowSkin Organics', 580000::bigint, 'pending'::text, 'Summer Skincare Series (3 Reels)'::text, (CURRENT_DATE + 10)::date, NULL::timestamptz),
    (3, 'Pulse Fitness', 120000::bigint, 'paid'::text, 'Activewear Launch IGTV'::text, (CURRENT_DATE - 5)::date, (NOW() - interval '2 days')::timestamptz),
    (4, 'Brew & Bean', 175000::bigint, 'overdue'::text, 'Podcast Sponsorship Clip'::text, (CURRENT_DATE - 12)::date, NULL::timestamptz)
  ) AS v(sort_idx, client_name, amount_cents, status, description, due_date, paid_at)
)
INSERT INTO public.payments (
  workspace_id,
  client_name,
  amount_cents,
  currency,
  status,
  due_date,
  description,
  paid_at
)
SELECT
  w.id,
  s.client_name,
  s.amount_cents,
  'usd',
  s.status,
  s.due_date,
  s.description,
  s.paid_at
FROM empty_workspaces w
CROSS JOIN seed s;
