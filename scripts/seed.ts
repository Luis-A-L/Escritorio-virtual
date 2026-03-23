import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const INITIAL_EMPLOYEES = [
  { id: 1, name: 'Ana Silva', team: 'Triagem Cível', education: 'Graduação', status: 'on-site', level: 1, errors: [], homeOfficeUsedThisMonth: 0, mood: 'focused', gender: 'female', avatar: 'f1', deskPosition: { row: 0, col: 0 } },
  { id: 2, name: 'Carlos Costa', team: 'Triagem Crime', education: 'Graduação', status: 'on-site', level: 1, errors: [], homeOfficeUsedThisMonth: 0, mood: 'happy', gender: 'male', avatar: 'm1', deskPosition: { row: 0, col: 1 } },
  { id: 3, name: 'Beatriz Lima', team: 'Retorno Cível', education: 'Graduação', status: 'on-site', level: 1, errors: [], homeOfficeUsedThisMonth: 0, mood: 'focused', gender: 'female', avatar: 'f2', deskPosition: { row: 0, col: 2 } },
  { id: 4, name: 'João Santos', team: 'Controle', education: 'Graduação', status: 'on-site', level: 1, errors: [], homeOfficeUsedThisMonth: 0, mood: 'tired', gender: 'male', avatar: 'm2', deskPosition: { row: 1, col: 0 } },
  { id: 5, name: 'Mariana Alves', team: 'I.A.', education: 'Graduação', status: 'on-site', level: 1, errors: [], homeOfficeUsedThisMonth: 0, mood: 'happy', gender: 'female', avatar: 'f3', deskPosition: { row: 1, col: 1 } },
  { id: 6, name: 'Pedro Rocha', team: 'Retorno Crime', education: 'Graduação', status: 'on-site', level: 1, errors: [], homeOfficeUsedThisMonth: 0, mood: 'blocked', gender: 'male', avatar: 'm3', deskPosition: { row: 1, col: 2 } }
];

const INITIAL_DESK_SLOTS = [
  { seatNumber: 1, left_pos: 40, top_pos: 30, variant: 'corner-tl' },
  { seatNumber: 2, left_pos: 40, top_pos: 185, variant: 'corner-bl' },
  { seatNumber: 3, left_pos: 45, top_pos: 360, variant: 'pillar' },
  { seatNumber: 4, left_pos: 45, top_pos: 530, variant: 'pillar' },
  { seatNumber: 5, left_pos: 45, top_pos: 700, variant: 'pillar' },
  { seatNumber: 6, left_pos: 430, top_pos: 80, variant: 'corner-br' },
  { seatNumber: 7, left_pos: 590, top_pos: 80, variant: 'corner-bl' },
  { seatNumber: 8, left_pos: 430, top_pos: 240, variant: 'corner-tr' },
  { seatNumber: 9, left_pos: 590, top_pos: 240, variant: 'corner-tl' },
  { seatNumber: 10, left_pos: 320, top_pos: 540, variant: 'corner-br' },
  { seatNumber: 11, left_pos: 480, top_pos: 540, variant: 'corner-bl' },
  { seatNumber: 12, left_pos: 320, top_pos: 700, variant: 'corner-tr' },
  { seatNumber: 13, left_pos: 480, top_pos: 700, variant: 'corner-tl' },
  { seatNumber: 14, left_pos: 980, top_pos: 80, variant: 'corner-br' },
  { seatNumber: 15, left_pos: 1140, top_pos: 80, variant: 'corner-bl' },
  { seatNumber: 16, left_pos: 980, top_pos: 240, variant: 'corner-tr' },
  { seatNumber: 17, left_pos: 1140, top_pos: 240, variant: 'corner-tl' },
  { seatNumber: 18, left_pos: 1250, top_pos: 560, variant: 'corner-br' },
  { seatNumber: 19, left_pos: 1410, top_pos: 560, variant: 'corner-bl' },
  { seatNumber: 20, left_pos: 1250, top_pos: 720, variant: 'corner-tr' },
  { seatNumber: 21, left_pos: 1410, top_pos: 720, variant: 'corner-tl' },
  { seatNumber: 22, left_pos: 790, top_pos: 930, variant: 'boss', isBoss: true },
];

async function seed() {
  console.log("Seeding database...");

  // Seed desks
  const { error: deskError } = await supabase
    .from('desk_slots')
    .upsert(INITIAL_DESK_SLOTS);
  
  if (deskError) console.error("Error seeding desks:", deskError);
  else console.log("Desks seeded successfully.");

  // Seed employees
  const { error: empError } = await supabase
    .from('employees')
    .upsert(INITIAL_EMPLOYEES);

  if (empError) console.error("Error seeding employees:", empError);
  else console.log("Employees seeded successfully.");

  console.log("Seeding complete!");
}

seed();
