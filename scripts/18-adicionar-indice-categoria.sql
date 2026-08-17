-- ============================================================
-- Script: 18-adicionar-indice-categoria.sql
-- Objetivo: Indice na coluna Tarefas.Tipo (CategoriaId) para
--           acelerar a contagem de tarefas por categoria
-- ============================================================

USE u292823232_tesisflowdb;

SET @stmt = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = 'u292823232_tesisflowdb' AND TABLE_NAME = 'Tarefas' AND INDEX_NAME = 'IX_Tarefas_CategoriaId') = 0,
    'CREATE INDEX IX_Tarefas_CategoriaId ON Tarefas (Tipo)',
    'SELECT 1'
);
PREPARE stmt FROM @stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;
