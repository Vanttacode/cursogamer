import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export const GET: APIRoute = async ({ cookies }) => {
  if (!cookies.get('admin_session')) return new Response('Unauthorized', { status: 401 });

  const { data: metaData } = await supabaseAdmin
    .from('meta')
    .select('value')
    .eq('key', 'spots_total')
    .single();

  const spotsTotal = parseInt(metaData?.value || '30');

  const { data: reservations } = await supabaseAdmin
    .from('reservations')
    .select('children_count, status');

  const activeStatuses = ['CONFIRMED', 'APPROVED', 'PAID'];
  
  const taken = reservations
    ?.filter(r => activeStatuses.includes(r.status))
    .reduce((acc, curr) => acc + (curr.children_count || 0), 0) || 0;

  const statusCounts = reservations?.reduce((acc: any, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {}) || {};

  return new Response(JSON.stringify({
    spotsTotal,
    taken,
    available: Math.max(0, spotsTotal - taken),
    statusCounts
  }), { status: 200 });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!cookies.get('admin_session')) return new Response('Unauthorized', { status: 401 });
  const { value } = await request.json();

  await supabaseAdmin
    .from('meta')
    .upsert({ key: 'spots_total', value: String(value) });

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
