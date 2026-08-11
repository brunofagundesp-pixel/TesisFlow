-- ============================================================
-- Script: 08-fixar-chaves-sem-zeros.sql
-- Objetivo: Remover zeros a esquerda de chaves existentes
-- Ex: AM-0004 -> AM-4, APP-0001 -> APP-1
-- ============================================================

USE u292823232_tesisflowdb;

UPDATE Tarefas 
SET Chave = CONCAT(SUBSTRING_INDEX(Chave, '-', 1), '-', CAST(CAST(SUBSTRING_INDEX(Chave, '-', -1) AS UNSIGNED) AS CHAR))
WHERE Chave IS NOT NULL;
