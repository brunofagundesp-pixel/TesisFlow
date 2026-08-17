-- Migracao: Adicionar colunas DataEntrega e LembreteNivel na tabela Tarefas
-- Data: 2026-08-17
-- Execute no banco u292823232_tesisflowdb

ALTER TABLE Tarefas ADD COLUMN DataEntrega DATETIME NULL;
ALTER TABLE Tarefas ADD COLUMN LembreteNivel INT NOT NULL DEFAULT 0;
