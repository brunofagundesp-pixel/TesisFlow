-- Migracao: Adicionar colunas TarefaId e ProjetoId na tabela Notificacoes
-- Data: 2026-08-17
-- Execute no banco u292823232_tesisflowdb

ALTER TABLE Notificacoes ADD COLUMN TarefaId INT NULL;
ALTER TABLE Notificacoes ADD COLUMN ProjetoId INT NULL;

CREATE INDEX IX_Notificacoes_TarefaId ON Notificacoes (TarefaId);
CREATE INDEX IX_Notificacoes_ProjetoId ON Notificacoes (ProjetoId);
