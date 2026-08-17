-- Migracao: Adicionar coluna Entregue na tabela Mensagens
-- Data: 2026-08-17
-- Execute no banco u292823232_tesisflowdb

ALTER TABLE Mensagens ADD COLUMN Entregue TINYINT(1) NOT NULL DEFAULT 0 AFTER Lida;
