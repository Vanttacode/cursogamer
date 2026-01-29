import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export const GET: APIRoute = async ({ request, cookies }) => {
  // 1. Seguridad: Verificar sesión
  if (!cookies.get('admin_session')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const url = new URL(request.url);
  const search = url.searchParams.get('q');
  
  // 2. Query base
  let query = supabaseAdmin
    .from('reservations')
    .select('*')
    .order('created_at', { ascending: false });

  // 3. Filtro de búsqueda (Aquí estaba el error de sintaxis)
  if (search) {
    // Buscamos por nombre, email, whatsapp o ID exacto
    query = query.or(`guardian_name.ilike.%${search}%,email.ilike.%${search}%,whatsapp.ilike.%${search}%,id.eq.${search}`);
  }

  const { data, error } = await query;
  
  if (error) {
    return new Response(JSON.stringify({ error }), { status: 500 });
  }

  return new Response(JSON.stringify(data), { status: 200 });
};