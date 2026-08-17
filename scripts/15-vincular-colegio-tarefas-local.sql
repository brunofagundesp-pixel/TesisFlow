-- ============================================================
-- Script: 15-vincular-colegio-tarefas-local.sql
-- Objetivo: Adicionar vinculo da tarefa com o colegio (cliente)
--           no banco de DESENVOLVIMENTO local (TesisFlowDB).
--           ColegioId  -> idColegio da API externa (referencia)
--           ColegioNome -> snapshot do nome para exibicao
-- ============================================================

USE TesisFlowDB;

SET @stmt = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'TesisFlowDB' AND TABLE_NAME = 'Tarefas' AND COLUMN_NAME = 'ColegioId') = 0,
    'ALTER TABLE Tarefas ADD COLUMN ColegioId INT NULL AFTER CriadorId',
    'SELECT 1'
);
PREPARE stmt FROM @stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @stmt = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'TesisFlowDB' AND TABLE_NAME = 'Tarefas' AND COLUMN_NAME = 'ColegioNome') = 0,
    'ALTER TABLE Tarefas ADD COLUMN ColegioNome VARCHAR(300) NULL AFTER ColegioId',
    'SELECT 1'
);
PREPARE stmt FROM @stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @stmt = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = 'TesisFlowDB' AND TABLE_NAME = 'Tarefas' AND INDEX_NAME = 'IX_Tarefas_ColegioId') = 0,
    'CREATE INDEX IX_Tarefas_ColegioId ON Tarefas (ColegioId)',
    'SELECT 1'
);
PREPARE stmt FROM @stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;
