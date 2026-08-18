-- Migracao: Adicionar colunas de imagem na tabela Mensagens
-- Data: 2026-08-17
-- Execute no banco u292823232_tesisflowdb
-- (As colunas tambem sao aplicadas automaticamente no startup via Program.cs)

ALTER TABLE Mensagens ADD COLUMN Imagem VARCHAR(500) NULL AFTER VinculoIcone;
ALTER TABLE Mensagens ADD COLUMN ImagemNome VARCHAR(255) NULL AFTER Imagem;
