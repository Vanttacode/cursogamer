import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.warn('âš ï¸ Faltan variables de entorno SUPABASE_SERVICE_ROLE_KEY. El admin no funcionarÃ¡ correctamente.');
}

export const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY || '', {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
