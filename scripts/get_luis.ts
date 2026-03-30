import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('employees').select('*').ilike('name', '%Luis Gustavo%');
  if (error) console.error("ERROR:", error.message);
  else fs.writeFileSync('luis_state.json', JSON.stringify(data, null, 2));
}
check();
