import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function clean() {
  const { data: emps, error } = await supabase.from('employees').select('id, name');
  
  if (error) { console.error(error); return; }

  const nameMap = new Map();
  emps.forEach(e => {
    let norm = e.name.toLowerCase().trim();
    // Normalize accents to find matches like "Luis" vs "Luís"
    norm = norm.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (!nameMap.has(norm)) {
      nameMap.set(norm, [e]);
    } else {
      nameMap.get(norm).push(e);
    }
  });

  const duplicateMap = {};
  for (const [name, duplicates] of nameMap.entries()) {
    if (duplicates.length > 1) {
      const oldIds = duplicates.filter(d => d.id < 1000).map(d => d.id);
      duplicateMap[name] = { all: duplicates.map(d=>d.id), oldIds };
    }
  }
  fs.writeFileSync('duplicate_report.json', JSON.stringify(duplicateMap, null, 2));
}
clean();
