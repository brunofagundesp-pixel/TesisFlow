-- ============================================================
-- Script: 05-adicionar-data-atualizacao.sql
-- Objetivo: Adicionar DataAtualizacao em tabelas do EntidadeBase
-- ============================================================

USE TesisFlowDB;

SET @stmt = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'TesisFlowDB' AND TABLE_NAME = 'Tarefas' AND COLUMN_NAME = 'DataAtualizacao') = 0,
    'ALTER TABLE Tarefas ADD COLUMN DataAtualizacao DATETIME NULL AFTER DataCriacao',
    'SELECT 1'
);
PREPARE stmt FROM @stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @stmt = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'TesisFlowDB' AND TABLE_NAME = 'Projetos' AND COLUMN_NAME = 'DataAtualizacao') = 0,
    'ALTER TABLE Projetos ADD COLUMN DataAtualizacao DATETIME NULL AFTER DataCriacao',
    'SELECT 1'
);
PREPARE stmt FROM @stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @stmt = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'TesisFlowDB' AND TABLE_NAME = 'Sprints' AND COLUMN_NAME = 'DataAtualizacao') = 0,
    'ALTER TABLE Sprints ADD COLUMN DataAtualizacao DATETIME NULL AFTER DataCriacao',
    'SELECT 1'
);
PREPARE stmt FROM @stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @stmt = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'TesisFlowDB' AND TABLE_NAME = 'Comentarios' AND COLUMN_NAME = 'DataAtualizacao') = 0,
    'ALTER TABLE Comentarios ADD COLUMN DataAtualizacao DATETIME NULL AFTER DataCriacao',
    'SELECT 1'
);
PREPARE stmt FROM @stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @stmt = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'TesisFlowDB' AND TABLE_NAME = 'QuadroConfiguracoes' AND COLUMN_NAME = 'DataAtualizacao') = 0,
    'ALTER TABLE QuadroConfiguracoes ADD COLUMN DataAtualizacao DATETIME NULL AFTER DataCriacao',
    'SELECT 1'
);
PREPARE stmt FROM @stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;
