-- ============================================================
-- Script: 06-corrigir-tarefa-responsaveis.sql
-- Objetivo: Adicionar DataAtualizacao na tabela nova
-- ============================================================

USE u292823232_tesisflowdb;

SET @stmt = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'u292823232_tesisflowdb' AND TABLE_NAME = 'TarefaResponsaveis' AND COLUMN_NAME = 'DataAtualizacao') = 0,
    'ALTER TABLE TarefaResponsaveis ADD COLUMN DataAtualizacao DATETIME NULL AFTER DataCriacao',
    'SELECT 1'
);
PREPARE stmt FROM @stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;
