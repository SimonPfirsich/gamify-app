/**
 * Supabase Client Initialization
 */
const { createClient } = supabase;

const SUPABASE_URL = 'https://ujnfphuxzzezdxuimhct.supabase.co';
const SUPABASE_KEY = 'sb_publishable_HJa91JXJZV1ej4wSwYarmA_4JkZkqBH';

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
