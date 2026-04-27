-- Optional: insert 3 demo brand rows per workspace that has none yet (so the contact/activity seed can run).
-- Run BEFORE 202604281401 or 20260428150200 if your public.brands table is empty.

INSERT INTO public.brands (workspace_id, name, industry, description)
SELECT w.id, v.name, v.industry, v.description
FROM public.workspaces w
CROSS JOIN (
  VALUES
    ('Lumina Skincare', 'Beauty', 'Skincare and UGC content'),
    ('Evergreen Eco', 'Lifestyle', 'Sustainability and wellness'),
    ('Peak Athletics', 'Sport', 'Activewear and performance')
) AS v(name, industry, description)
WHERE NOT EXISTS (SELECT 1 FROM public.brands b WHERE b.workspace_id = w.id);
