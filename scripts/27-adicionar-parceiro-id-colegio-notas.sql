-- ============================================================
-- Script: 27-adicionar-parceiro-id-colegio-notas.sql
-- Objetivo: Adicionar a coluna ParceiroId na tabela ColegioNotas
--           para deduplicar notas sincronizadas dos parceiros
--           (api/TesisCc/ListarParceirosCliente).
-- ============================================================

USE u292823232_tesisflowdb;

ALTER TABLE ColegioNotas
    ADD COLUMN ParceiroId INT NULL;

CREATE INDEX IX_ColegioNotas_ParceiroId ON ColegioNotas (ParceiroId);
