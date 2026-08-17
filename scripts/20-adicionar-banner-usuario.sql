-- ============================================================
-- Script: 20-adicionar-banner-usuario.sql
-- Objetivo: Coluna Banner na tabela Usuarios (imagem de capa
--           da tela "Para voce")
-- ============================================================

USE u292823232_tesisflowdb;

SET @stmt = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'u292823232_tesisflowdb' AND TABLE_NAME = 'Usuarios' AND COLUMN_NAME = 'Banner') = 0,
    'ALTER TABLE Usuarios ADD COLUMN Banner VARCHAR(1000) NULL',
    'SELECT 1'
);
PREPARE stmt FROM @stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;
