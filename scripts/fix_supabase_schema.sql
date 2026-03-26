-- Execute este script no SQL Editor do seu projeto Supabase para adicionar as novas colunas necessárias:

ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS "homeOfficeDates" text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "vacationStart" text,
ADD COLUMN IF NOT EXISTS "vacationEnd" text;

-- Opcional: Se você ainda não tem a coluna de estilo dos móveis:
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS "deskStyle" text DEFAULT 'simple',
ADD COLUMN IF NOT EXISTS "monitorStyle" text DEFAULT 'simple',
ADD COLUMN IF NOT EXISTS "mouseStyle" text DEFAULT 'simple',
ADD COLUMN IF NOT EXISTS "keyboardStyle" text DEFAULT 'simple',
ADD COLUMN IF NOT EXISTS "characterOffset" jsonb DEFAULT '{"x": 0, "y": 0, "rotation": 0}';
