import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Next.js 15+ may cache `fetch` by default. PostgREST reads must not be served from
 * cache after a mutation, or new rows disappear until the cache entry expires.
 */
function supabaseFetch(input: RequestInfo | URL, init?: RequestInit) {
  return fetch(input, {
    ...init,
    cache: "no-store",
  });
}

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { fetch: supabaseFetch },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component: ignore if read-only
          }
        },
      },
    },
  );
}

export async function createServiceRoleClient() {
  const { createClient: createService } = await import("@supabase/supabase-js");
  return createService(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: supabaseFetch },
    },
  );
}
