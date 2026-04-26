# InstaCRM

A production-oriented CRM SaaS: **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS 4**, **shadcn/ui (Base UI)**, **Supabase** (auth + Postgres + RLS), and **Stripe** (subscriptions + portal + webhooks).

## Features

- **Auth**: email/password, Google OAuth (configure in Supabase)
- **Dashboard**: pipeline totals, open tasks, 30d revenue chart (Recharts)
- **Leads** full CRUD, **Deals** Kanban (drag & drop)
- **Brands**, **Tasks** with due/reminder fields, **Payments** tracker, **Templates**
- **Settings** (profile, digest, timezone), **Billing** (Stripe Checkout + Customer Portal)

## Setup

1. **Install**

   ```bash
   cd instacrm
   npm install
   ```

2. **Supabase**  
   - Create a project.  
   - Run the SQL in `supabase/migrations/20260427000000_init.sql` (SQL editor or `supabase db push`).  
   - Auth → enable **Google** and add redirect: `https://<your-app>/auth/callback` (and `http://localhost:3000/auth/callback` for dev).

3. **Env**  
   Copy `.env.local.example` to `.env.local` and fill in keys from Supabase and Stripe.

4. **Stripe**  
   - Create a product/price; set `STRIPE_PRICE_ID_PRO`.  
   - For webhooks (local: Stripe CLI) use `STRIPE_WEBHOOK_SECRET` and point the endpoint to `/api/stripe/webhook`.

5. **Run**

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000), sign up, and use the app. New users get a default workspace and profile via a database trigger.

## Project structure

- `src/app` — App Router: `(app)` for CRM, `(auth)` for login/signup, `api` for Stripe, `auth/callback` for OAuth.
- `src/components` — UI: layout, dashboard charts, leads, deals Kanban, etc.
- `src/lib` — Supabase (browser/server/service role), Stripe, money helpers, dashboard aggregates.
- `src/app/actions/crm.ts` — Server actions for CRUD (RLS enforced).
- `supabase/migrations` — Schema, RLS, `handle_new_user` trigger.

## Deploy to Vercel

1. **Push this repo to GitHub** (if it is not there yet).

   ```bash
   git remote add origin https://github.com/JaswinderSingh22/InstaCRM.git
   git push -u origin main
   ```

   If `origin` already exists, use:  
   `git remote set-url origin https://github.com/JaswinderSingh22/InstaCRM.git`

2. **Import on Vercel**  
   - Open [vercel.com](https://vercel.com) → **Add New** → **Project** → import **InstaCRM** from GitHub.  
   - **Framework Preset:** Next.js (auto-detected). **Root directory:** leave default if the repo root is the app (this project’s root is the Next.js app).  
   - **Build:** `npm run build` and output `.next` are the defaults. Do not commit `.env.local`; you will set secrets in Vercel.

3. **Environment variables** (Vercel → Project → **Settings** → **Environment Variables**).  
   Add the same names as in `.env.local.example`, for **Production** (and Preview if you want preview deploys to work with auth/billing).

   | Name | Production value |
   |------|------------------|
   | `NEXT_PUBLIC_APP_URL` | `https://<your-project>.vercel.app` (or your custom domain) |
   | `NEXT_PUBLIC_SUPABASE_URL` | From Supabase → Settings → API |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key (sensitive) |
   | `STRIPE_SECRET_KEY` | `sk_live_...` (or `sk_test_...` for testing) |
   | `STRIPE_PRICE_ID_PRO` | `price_...` from Stripe |
   | `STRIPE_WEBHOOK_SECRET` | From Stripe **Developers** → **Webhooks** after you add the endpoint below |

4. **After first deploy**  
   - **Supabase** → **Authentication** → **URL Configuration**: set **Site URL** to your Vercel URL and add **Redirect URL** `https://<your-project>.vercel.app/auth/callback` (and your custom domain if you add one).  
   - **Stripe** → **Webhooks** → add endpoint: `https://<your-project>.vercel.app/api/stripe/webhook` → select subscription/invoice events as needed → copy the **signing secret** into `STRIPE_WEBHOOK_SECRET` in Vercel, then **Redeploy** so the server picks it up.

5. **Redeploy** after changing any environment variable.
