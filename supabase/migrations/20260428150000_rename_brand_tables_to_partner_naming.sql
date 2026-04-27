-- Unify naming: one `brands` table; related data lives in
--   partner_contacts  (was brand_contacts)
--   relationship_events (was brand_activities)
-- Idempotent: safe if already renamed. Run in Supabase SQL editor or `supabase db push`.

DO $$
DECLARE
  c record;
  tname text;
BEGIN
  -- 1) Rename tables: old name exists, new name not yet
  IF to_regclass('public.brand_contacts') IS NOT NULL
     AND to_regclass('public.partner_contacts') IS NULL THEN
    ALTER TABLE public.brand_contacts RENAME TO partner_contacts;
  END IF;
  IF to_regclass('public.brand_activities') IS NOT NULL
     AND to_regclass('public.relationship_events') IS NULL THEN
    ALTER TABLE public.brand_activities RENAME TO relationship_events;
  END IF;

  -- 2) Rename constraints on partner_contacts (after table rename)
  IF to_regclass('public.partner_contacts') IS NOT NULL THEN
    FOR c IN
      SELECT conname
      FROM pg_constraint
      WHERE connamespace = 'public'::regnamespace
        AND conrelid = 'public.partner_contacts'::regclass
        AND conname LIKE 'brand_contacts%'
    LOOP
      tname := replace(c.conname, 'brand_contacts', 'partner_contacts');
      IF tname IS DISTINCT FROM c.conname
         AND NOT EXISTS (
           SELECT 1 FROM pg_constraint n
           WHERE n.connamespace = 'public'::regnamespace
             AND n.conrelid = 'public.partner_contacts'::regclass
             AND n.conname = tname
         ) THEN
        EXECUTE format('ALTER TABLE public.partner_contacts RENAME CONSTRAINT %I TO %I', c.conname, tname);
      END IF;
    END LOOP;
  END IF;

  -- 3) Rename constraints on relationship_events
  IF to_regclass('public.relationship_events') IS NOT NULL THEN
    FOR c IN
      SELECT conname
      FROM pg_constraint
      WHERE connamespace = 'public'::regnamespace
        AND conrelid = 'public.relationship_events'::regclass
        AND conname LIKE 'brand_activities%'
    LOOP
      tname := replace(c.conname, 'brand_activities', 'relationship_events');
      IF tname IS DISTINCT FROM c.conname
         AND NOT EXISTS (
           SELECT 1 FROM pg_constraint n
           WHERE n.connamespace = 'public'::regnamespace
             AND n.conrelid = 'public.relationship_events'::regclass
             AND n.conname = tname
         ) THEN
        EXECUTE format('ALTER TABLE public.relationship_events RENAME CONSTRAINT %I TO %I', c.conname, tname);
      END IF;
    END LOOP;
  END IF;
END
$$;

-- 4) Indexes (non-pk) — name prefix fix (only if old name exists and new name is free)
DO $$
BEGIN
  IF to_regclass('public.partner_contacts') IS NOT NULL
     AND EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'brand_contacts_workspace_brand_idx')
     AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'partner_contacts_workspace_brand_idx') THEN
    ALTER INDEX public.brand_contacts_workspace_brand_idx RENAME TO partner_contacts_workspace_brand_idx;
  END IF;
  IF to_regclass('public.relationship_events') IS NOT NULL
     AND EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'brand_activities_workspace_occurred_idx')
     AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'relationship_events_workspace_occurred_idx') THEN
    ALTER INDEX public.brand_activities_workspace_occurred_idx RENAME TO relationship_events_workspace_occurred_idx;
  END IF;
  IF to_regclass('public.relationship_events') IS NOT NULL
     AND EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'brand_activities_brand_idx')
     AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'relationship_events_brand_idx') THEN
    ALTER INDEX public.brand_activities_brand_idx RENAME TO relationship_events_brand_idx;
  END IF;
END
$$;

-- 5) Triggers
DO $$
BEGIN
  IF to_regclass('public.partner_contacts') IS NOT NULL
     AND EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'brand_contacts_updated_at' AND tgrelid = 'public.partner_contacts'::regclass)
     AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'partner_contacts_updated_at' AND tgrelid = 'public.partner_contacts'::regclass) THEN
    ALTER TRIGGER brand_contacts_updated_at ON public.partner_contacts RENAME TO partner_contacts_updated_at;
  END IF;
  IF to_regclass('public.relationship_events') IS NOT NULL
     AND EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'brand_activities_updated_at' AND tgrelid = 'public.relationship_events'::regclass)
     AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'relationship_events_updated_at' AND tgrelid = 'public.relationship_events'::regclass) THEN
    ALTER TRIGGER brand_activities_updated_at ON public.relationship_events RENAME TO relationship_events_updated_at;
  END IF;
END
$$;

-- 6) RLS policy display names
DO $$
BEGIN
  IF to_regclass('public.partner_contacts') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM pg_policies
       WHERE schemaname = 'public' AND tablename = 'partner_contacts' AND policyname = 'Brand contacts crud'
     ) THEN
    ALTER POLICY "Brand contacts crud" ON public.partner_contacts RENAME TO "Partner contacts crud";
  END IF;
  IF to_regclass('public.relationship_events') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM pg_policies
       WHERE schemaname = 'public' AND tablename = 'relationship_events' AND policyname = 'Brand activities crud'
     ) THEN
    ALTER POLICY "Brand activities crud" ON public.relationship_events RENAME TO "Relationship events crud";
  END IF;
END
$$;
