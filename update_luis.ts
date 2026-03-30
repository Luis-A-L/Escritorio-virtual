import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateLuis() {
  const { data, error } = await supabase
    .from('employees')
    .update({ homeOfficeDates: ['25/03/2026'] })
    .ilike('name', '%Luis Gustavo%');

  if (error) {
    console.error("Error updating Luis Gustavo:", error);
  } else {
    console.log("Successfully updated Luis Gustavo's home office date.");
  }
}

updateLuis();
