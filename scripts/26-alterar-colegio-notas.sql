-- ============================================================
-- Script: 26-alterar-colegio-notas.sql
-- Objetivo: Migrar a tabela ColegioNotas para a versao com
--           multiplas notas por colegio (Cor e Fixa).
--           Executar APENAS se a tabela ja foi criada pela
--           versao anterior do script 25 (com UNIQUE INDEX).
-- ============================================================

USE u292823232_tesisflowdb;

ALTER TABLE ColegioNotas
    ADD COLUMN Cor  VARCHAR(20)  NOT NULL DEFAULT '',
    ADD COLUMN Fixa TINYINT(1)   NOT NULL DEFAULT 0;

ALTER TABLE ColegioNotas DROP INDEX IX_ColegioNotas_ColegioId;
CREATE INDEX IX_ColegioNotas_ColegioId ON ColegioNotas (ColegioId);
