-- Migracao: Adicionar colunas de vinculo (tarefa/escola) na tabela Mensagens
-- Data: 2026-08-17
-- Execute no banco u292823232_tesisflowdb
-- (As colunas tambem sao aplicadas automaticamente no startup via Program.cs)

ALTER TABLE Mensagens ADD COLUMN VinculoTipo VARCHAR(20) NULL AFTER MensagemRespondidaId;
ALTER TABLE Mensagens ADD COLUMN VinculoId INT NULL AFTER VinculoTipo;
ALTER TABLE Mensagens ADD COLUMN VinculoTitulo VARCHAR(300) NULL AFTER VinculoId;
ALTER TABLE Mensagens ADD COLUMN VinculoSubtitulo VARCHAR(300) NULL AFTER VinculoTitulo;
ALTER TABLE Mensagens ADD COLUMN VinculoLink VARCHAR(500) NULL AFTER VinculoSubtitulo;
ALTER TABLE Mensagens ADD COLUMN VinculoIcone VARCHAR(50) NULL AFTER VinculoLink;
