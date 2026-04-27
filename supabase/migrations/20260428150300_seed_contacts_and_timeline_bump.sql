-- Extra demo rows for contact directory + relationship activity timeline.
-- Idempotent: uses NOT EXISTS on (brand_id, email) for contacts and (brand_id, title) for events.

-- Two additional contacts per brand (beyond the initial 3-per-workspace seed).
INSERT INTO public.partner_contacts (
  workspace_id, brand_id, name, email, role, status, last_contacted_at
)
SELECT
  b.workspace_id,
  b.id,
  v.name,
  v.email,
  v.role,
  v.status,
  v.last_at
FROM public.brands b
CROSS JOIN (
  VALUES
    (
      'Alex Rivera',
      'alex.rivera.seed@instacrm.local',
      'Partnerships',
      'active',
      (NOW() - interval '2 days')
    ),
    (
      'Morgan Price',
      'morgan.price.seed@instacrm.local',
      'Creative Director',
      'active',
      (NOW() - interval '4 hours')
    )
) AS v(name, email, role, status, last_at)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.partner_contacts c
  WHERE c.brand_id = b.id AND c.email = v.email
);

-- Richer activity timeline: several events per brand.
INSERT INTO public.relationship_events (
  workspace_id, brand_id, kind, title, body, amount_cents, occurred_at
)
SELECT
  b.workspace_id,
  b.id,
  a.kind,
  a.title,
  a.body,
  a.amount,
  a.occ
FROM public.brands b
CROSS JOIN (
  VALUES
    (
      'meeting',
      'Kickoff call scheduled',
      '30-minute sync to align on deliverables and next steps.',
      NULL::bigint,
      (NOW() - interval '2 hours')
    ),
    (
      'note',
      'Slack check-in',
      'Shared moodboard references; waiting on final brand guidelines.',
      NULL::bigint,
      (NOW() - interval '1 day')
    ),
    (
      'email',
      'Follow-up sent',
      'Revised scope attached; legal review in progress.',
      NULL::bigint,
      (NOW() - interval '3 days')
    ),
    (
      'meeting',
      'Quarterly business review',
      'Reviewed pipeline and renewal options for next cycle.',
      NULL::bigint,
      (NOW() - interval '6 days')
    ),
    (
      'note',
      'Content calendar draft',
      'Proposed posting cadence; feedback requested by Friday.',
      NULL::bigint,
      (NOW() - interval '10 days')
    )
) AS a(kind, title, body, amount, occ)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.relationship_events e
  WHERE e.brand_id = b.id AND e.title = a.title
);
