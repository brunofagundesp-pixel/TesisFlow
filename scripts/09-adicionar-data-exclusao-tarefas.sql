-- ============================================================
-- Script: 09-adicionar-data-exclusao-tarefas.sql
-- Objetivo: Adicionar coluna DataExclusao (para a lixeira de 30 dias).
-- Opcional: preenche DataExclusao das tarefas ja excluidas com a
-- data de atualizacao (descomente a linha final se quiser backfill).
-- ============================================================

USE u292823232_tesisflowdb;

SET @stmt = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'u292823232_tesisflowdb' AND TABLE_NAME = 'Tarefas' AND COLUMN_NAME = 'DataExclusao') = 0,
    'ALTER TABLE Tarefas ADD COLUMN DataExclusao DATETIME NULL AFTER DataConclusao',
    'SELECT 1'
);
PREPARE stmt FROM @stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Backfill opcional: tarefas ja excluidas (Ativo=0) sem DataExclusao.
-- UPDATE Tarefas SET DataExclusao = COALESCE(DataAtualizacao, DataCriacao) WHERE Ativo = 0 AND DataExclusao IS NULL;
