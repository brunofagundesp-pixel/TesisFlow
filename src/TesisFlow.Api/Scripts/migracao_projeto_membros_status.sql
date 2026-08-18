-- Migracao: Adicionar coluna Status na tabela ProjetoMembros
-- Data: 2026-08-18
-- Execute no banco u292823232_tesisflowdb
-- Valores: 1 = Pendente, 2 = Aceito, 3 = Recusado

ALTER TABLE ProjetoMembros ADD COLUMN Status INT NOT NULL DEFAULT 2;
