import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cliente para uso no Frontend e Server Components básicos
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente administrativo para o Backend (API Routes)
export const getSupabaseAdmin = () => {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing in environment variables');
    }
    return createClient(supabaseUrl, serviceRoleKey);
};
