import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://oyckahtqnlhtegrddtaq.supabase.co';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95Y2thaHRxbmxodGVncmRkdGFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTUzMTcsImV4cCI6MjA4OTg3MTMxN30.ueqY1U6qA3cLF8XXt3SZevw49_xk0ZuMXknAc-cKoX0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
