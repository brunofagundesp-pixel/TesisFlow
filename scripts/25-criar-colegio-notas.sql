-- ============================================================
-- Script: 25-criar-colegio-notas.sql
-- Objetivo: Tabela de notas/anotacoes por colegio (estilo
--           Google Keep: multiplas notas, cor e fixacao)
-- ============================================================

USE u292823232_tesisflowdb;

CREATE TABLE IF NOT EXISTS ColegioNotas (
    Id              INT             NOT NULL AUTO_INCREMENT,
    ColegioId       INT             NOT NULL,
    Titulo          VARCHAR(200)    NOT NULL DEFAULT '',
    Conteudo        TEXT            NULL,
    Cor             VARCHAR(20)     NOT NULL DEFAULT '',
    Fixa            TINYINT(1)      NOT NULL DEFAULT 0,
    DataCriacao     DATETIME        NOT NULL,
    DataAtualizacao DATETIME        NULL,
    Ativo           TINYINT(1)      NOT NULL DEFAULT 1,
    PRIMARY KEY (Id),
    INDEX IX_ColegioNotas_ColegioId (ColegioId)
) ENGINE=InnoDB;
