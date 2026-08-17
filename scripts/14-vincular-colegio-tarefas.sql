-- ============================================================
-- Script: 14-vincular-colegio-tarefas.sql
-- Objetivo: Adicionar vinculo da tarefa com o colegio (cliente)
--           ColegioId  -> idColegio da API externa (referencia)
--           ColegioNome -> snapshot do nome para exibicao
-- ============================================================

USE u292823232_tesisflowdb;

SET @stmt = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'u292823232_tesisflowdb' AND TABLE_NAME = 'Tarefas' AND COLUMN_NAME = 'ColegioId') = 0,
    'ALTER TABLE Tarefas ADD COLUMN ColegioId INT NULL AFTER CriadorId',
    'SELECT 1'
);
PREPARE stmt FROM @stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @stmt = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'u292823232_tesisflowdb' AND TABLE_NAME = 'Tarefas' AND COLUMN_NAME = 'ColegioNome') = 0,
    'ALTER TABLE Tarefas ADD COLUMN ColegioNome VARCHAR(300) NULL AFTER ColegioId',
    'SELECT 1'
);
PREPARE stmt FROM @stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @stmt = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = 'u292823232_tesisflowdb' AND TABLE_NAME = 'Tarefas' AND INDEX_NAME = 'IX_Tarefas_ColegioId') = 0,
    'CREATE INDEX IX_Tarefas_ColegioId ON Tarefas (ColegioId)',
    'SELECT 1'
);
PREPARE stmt FROM @stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;
