-- ============================================================
-- Script: 10-adicionar-contato-nome-tarefas.sql
-- Objetivo: Adicionar coluna ContatoNome (nome da pessoa com quem
-- foi falado, exibido como "Nome do contato" no atendimento).
-- ============================================================

USE u292823232_tesisflowdb;

SET @stmt = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'u292823232_tesisflowdb' AND TABLE_NAME = 'Tarefas' AND COLUMN_NAME = 'ContatoNome') = 0,
    'ALTER TABLE Tarefas ADD COLUMN ContatoNome VARCHAR(200) NULL AFTER ColegioNome',
    'SELECT 1'
);
PREPARE stmt FROM @stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;
