-- ============================================================
-- Script: 21-adicionar-banner-usuario-local.sql
-- Objetivo: Coluna Banner na tabela Usuarios - DEV
-- ============================================================

USE TesisFlowDB;

SET @stmt = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'TesisFlowDB' AND TABLE_NAME = 'Usuarios' AND COLUMN_NAME = 'Banner') = 0,
    'ALTER TABLE Usuarios ADD COLUMN Banner VARCHAR(1000) NULL',
    'SELECT 1'
);
PREPARE stmt FROM @stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;
