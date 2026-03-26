-- Adicionar colunas de periféricos à tabela desk_slots
ALTER TABLE desk_slots ADD COLUMN IF NOT EXISTS "deskStyle" text DEFAULT 'simple';
ALTER TABLE desk_slots ADD COLUMN IF NOT EXISTS "deskColor" text DEFAULT '#ffffff';
ALTER TABLE desk_slots ADD COLUMN IF NOT EXISTS "monitorStyle" text DEFAULT 'simple';
ALTER TABLE desk_slots ADD COLUMN IF NOT EXISTS "monitorColor" text DEFAULT '#ffffff';
ALTER TABLE desk_slots ADD COLUMN IF NOT EXISTS "monitorOffset" jsonb DEFAULT '{"x": 0, "y": 0, "rotation": 0}';
ALTER TABLE desk_slots ADD COLUMN IF NOT EXISTS "mouseStyle" text DEFAULT 'simple';
ALTER TABLE desk_slots ADD COLUMN IF NOT EXISTS "mouseColor" text DEFAULT '#ffffff';
ALTER TABLE desk_slots ADD COLUMN IF NOT EXISTS "mouseOffset" jsonb DEFAULT '{"x": 0, "y": 0, "rotation": 0}';
ALTER TABLE desk_slots ADD COLUMN IF NOT EXISTS "keyboardStyle" text DEFAULT 'simple';
ALTER TABLE desk_slots ADD COLUMN IF NOT EXISTS "keyboardColor" text DEFAULT '#ffffff';
ALTER TABLE desk_slots ADD COLUMN IF NOT EXISTS "keyboardOffset" jsonb DEFAULT '{"x": 0, "y": 0, "rotation": 0}';

-- Migrar dados atuais dos funcionários para as mesas onde eles estão sentados
-- Usamos a fórmula de seatNumber para mapear a deskPosition dos funcionários para as mesas
UPDATE desk_slots ds
SET 
  "deskStyle" = e."deskStyle",
  "deskColor" = e."deskColor",
  "monitorStyle" = e."monitorStyle",
  "monitorColor" = e."monitorColor",
  "monitorOffset" = e."monitorOffset",
  "mouseStyle" = e."mouseStyle",
  "mouseColor" = e."mouseColor",
  "mouseOffset" = e."mouseOffset",
  "keyboardStyle" = e."keyboardStyle",
  "keyboardColor" = e."keyboardColor",
  "keyboardOffset" = e."keyboardOffset"
FROM employees e
WHERE ds."seatNumber" = ((e."deskPosition"->>'row')::int * 3 + (e."deskPosition"->>'col')::int + 1);
