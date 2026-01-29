import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!cookies.get('admin_session')) return new Response('Unauthorized', { status: 401 });

  const { id, status, action } = await request.json();

  if (action === 'get_receipt') {
    const { data: res } = await supabaseAdmin.from('reservations').select('receipt_path').eq('id', id).single();
    if (res?.receipt_path) {
      const { data } = await supabaseAdmin.storage
        .from('receipts')
        .createSignedUrl(res.receipt_path, 3600);
      return new Response(JSON.stringify({ url: data?.signedUrl }), { status: 200 });
    }
    return new Response(JSON.stringify({ url: null }), { status: 200 });
  }

  if (action === 'update_status') {
    const { error } = await supabaseAdmin
      .from('reservations')
      .update({ status })
      .eq('id', id);

    if (error) return new Response(JSON.stringify({ error }), { status: 500 });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }

  return new Response(null, { status: 400 });
};
