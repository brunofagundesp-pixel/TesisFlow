-- ============================================================
-- Script: 13-fixar-charset-emoji.sql
-- Objetivo: Corrigir charset para suportar emojis (utf8mb4)
-- ============================================================
USE u292823232_tesisflowdb;

ALTER TABLE ComentarioReacoes MODIFY COLUMN Emoji VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;
ALTER TABLE ComentarioReacoes CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
