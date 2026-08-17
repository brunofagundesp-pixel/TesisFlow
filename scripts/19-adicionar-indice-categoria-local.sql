-- ============================================================
-- Script: 19-adicionar-indice-categoria-local.sql
-- Objetivo: Indice na coluna Tarefas.Tipo (CategoriaId) - DEV
-- ============================================================

USE TesisFlowDB;

SET @stmt = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = 'TesisFlowDB' AND TABLE_NAME = 'Tarefas' AND INDEX_NAME = 'IX_Tarefas_CategoriaId') = 0,
    'CREATE INDEX IX_Tarefas_CategoriaId ON Tarefas (Tipo)',
    'SELECT 1'
);
PREPARE stmt FROM @stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;
