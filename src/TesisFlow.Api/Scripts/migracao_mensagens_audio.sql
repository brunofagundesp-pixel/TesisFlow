-- Migracao: Adicionar colunas Audio e AudioDuracao na tabela Mensagens
-- Data: 2026-08-17
-- Execute no banco u292823232_tesisflowdb
-- (Também aplicada automaticamente no startup via Program.cs)

ALTER TABLE Mensagens ADD COLUMN Audio VARCHAR(500) NULL AFTER Entregue;
ALTER TABLE Mensagens ADD COLUMN AudioDuracao INT NULL AFTER Audio;
