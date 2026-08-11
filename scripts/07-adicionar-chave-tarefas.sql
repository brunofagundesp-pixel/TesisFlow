-- ============================================================
-- Script: 07-adicionar-chave-tarefas.sql
-- Objetivo: Adicionar coluna Chave (ID unico estilo Jira)
-- ============================================================

USE u292823232_tesisflowdb;

SET @stmt = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'u292823232_tesisflowdb' AND TABLE_NAME = 'Tarefas' AND COLUMN_NAME = 'Chave') = 0,
    'ALTER TABLE Tarefas ADD COLUMN Chave VARCHAR(10) NULL AFTER Titulo',
    'SELECT 1'
);
PREPARE stmt FROM @stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @stmt = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = 'u292823232_tesisflowdb' AND TABLE_NAME = 'Tarefas' AND INDEX_NAME = 'IX_Tarefas_Chave') = 0,
    'CREATE UNIQUE INDEX IX_Tarefas_Chave ON Tarefas (Chave)',
    'SELECT 1'
);
PREPARE stmt FROM @stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;
