-- ============================================================
-- Script: 09-comentarios-replies-likes.sql
-- Objetivo: Adicionar replies, curtidas e reacoes
-- ============================================================
USE u292823232_tesisflowdb;

SET @stmt = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'u292823232_tesisflowdb' AND TABLE_NAME = 'Comentarios' AND COLUMN_NAME = 'ComentarioPaiId') = 0,
    'ALTER TABLE Comentarios ADD COLUMN ComentarioPaiId INT NULL AFTER UsuarioId, ADD FOREIGN KEY (ComentarioPaiId) REFERENCES Comentarios(Id) ON DELETE CASCADE',
    'SELECT 1'
);
PREPARE stmt FROM @stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @stmt = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'u292823232_tesisflowdb' AND TABLE_NAME = 'Comentarios' AND COLUMN_NAME = 'Curtidas') = 0,
    'ALTER TABLE Comentarios ADD COLUMN Curtidas INT NOT NULL DEFAULT 0 AFTER ComentarioPaiId',
    'SELECT 1'
);
PREPARE stmt FROM @stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;
