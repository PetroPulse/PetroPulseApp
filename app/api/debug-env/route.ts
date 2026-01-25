export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const sr  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return new Response(
    JSON.stringify({
      urlPresent: !!url,
      anonPresent: !!anon,
      srPresent: !!sr,
      urlLength: url?.length ?? 0,
      anonLength: anon?.length ?? 0,
      srLength: sr?.length ?? 0,
    }),
    { headers: { 'content-type': 'application/json' } }
  );
}
