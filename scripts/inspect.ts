import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function inspect() {
  console.log("Inspecting 'employees' table...");
  const { data, error } = await supabase.from('employees').select('*').limit(1);
  
  if (error) {
    console.error("Fetch Error:", error);
    console.log("Error details:", JSON.stringify(error, null, 2));
  } else {
    console.log("Fetch Success!");
    if (data && data.length > 0) {
      console.log("Columns found:", Object.keys(data[0]));
    } else {
      console.log("Table is empty, but query succeeded.");
    }
  }

  console.log("\nInspecting 'desk_slots' table...");
  const { data: desks, error: deskErr } = await supabase.from('desk_slots').select('*').limit(1);
  if (deskErr) {
    console.error("Desk Fetch Error:", deskErr);
  } else {
    console.log("Desk Fetch Success!");
    if (desks && desks.length > 0) {
      console.log("Desk Columns found:", Object.keys(desks[0]));
    }
  }
}

inspect();
