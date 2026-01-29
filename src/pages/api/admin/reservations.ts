import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export const GET: APIRoute = async ({ request, cookies }) => {
  if (!cookies.get('admin_session')) return new Response('Unauthorized', { status: 401 });

  const url = new URL(request.url);
  const search = url.searchParams.get('q');
  
  let query = supabaseAdmin
    .from('reservations')
    .select('*')
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(\guardian_name.ilike.%\%,email.ilike.%\%,whatsapp.ilike.%\%,id.eq.\\);
  }

  const { data, error } = await query;
  
  if (error) return new Response(JSON.stringify({ error }), { status: 500 });
  return new Response(JSON.stringify(data), { status: 200 });
};
