-- 1. Adicionar a coluna de email caso ela não exista
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "email" text;

-- 2. Atualizar todos os membros com os emails fornecidos
UPDATE employees SET email = '45708396814@tjpr.jus.br' WHERE name ILIKE '%Nelson%';
UPDATE employees SET email = '03601347938@tjpr.jus.br' WHERE name ILIKE '%Toni%';
UPDATE employees SET email = '11274685966@tjpr.jus.br' WHERE name ILIKE '%Alana%';
UPDATE employees SET email = '44016423848@tjpr.jus.br' WHERE name ILIKE '%Pietro%';
UPDATE employees SET email = '08448630920@tjpr.jus.br' WHERE name ILIKE '%Gustavo Dias%';
UPDATE employees SET email = 'rodrigo.louzano@tjpr.jus.br' WHERE name ILIKE '%Chefe%' OR name ILIKE '%Rodrigo%';
UPDATE employees SET email = '10508859964@tjpr.jus.br' WHERE name ILIKE '%Vinicius%';
UPDATE employees SET email = '03788983299@tjpr.jus.br' WHERE name ILIKE '%Narley%';
UPDATE employees SET email = '13382880911@tjpr.jus.br' WHERE name ILIKE '%Raquel%';
UPDATE employees SET email = '07356440989@tjpr.jus.br' WHERE name ILIKE '%Taynara%';
UPDATE employees SET email = '09159120908@tjpr.jus.br' WHERE name ILIKE '%Ademar%';
UPDATE employees SET email = '13001951931@tjpr.jus.br' WHERE name ILIKE '%Iara%';
UPDATE employees SET email = '15567554907@tjpr.jus.br' WHERE name ILIKE '%Iasmin%';
UPDATE employees SET email = '11804338907@tjpr.jus.br' WHERE name ILIKE '%Luís Gustavo%' OR name ILIKE '%Luis Gustavo%';
UPDATE employees SET email = '13176069901@tjpr.jus.br' WHERE name ILIKE '%Diogo%';
UPDATE employees SET email = '11203689950@tjpr.jus.br' WHERE name ILIKE '%Gustavo Scucuglia%';
UPDATE employees SET email = '07872538989@tjpr.jus.br' WHERE name ILIKE '%Victoria%';
UPDATE employees SET email = '10879209909@tjpr.jus.br' WHERE name ILIKE '%Henrique%';
UPDATE employees SET email = '09901184444@tjpr.jus.br' WHERE name ILIKE '%Marina%';
