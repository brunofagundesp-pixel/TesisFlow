-- ============================================================
-- Script: 08-adicionar-contato-id-tarefas.sql
-- Objetivo: Adicionar coluna ContatoId (idContato do atendimento
-- na API TesisCc) para sincronizar tarefa <-> atendimento.
-- ============================================================

USE u292823232_tesisflowdb;

SET @stmt = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'u292823232_tesisflowdb' AND TABLE_NAME = 'Tarefas' AND COLUMN_NAME = 'ContatoId') = 0,
    'ALTER TABLE Tarefas ADD COLUMN ContatoId INT NULL AFTER ColegioNome',
    'SELECT 1'
);
PREPARE stmt FROM @stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;
