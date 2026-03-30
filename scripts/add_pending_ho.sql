-- Adicionar a coluna de pendingHomeOfficeDates (Array de strings como JSON)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "pendingHomeOfficeDates" jsonb DEFAULT '[]'::jsonb;
