-- ============================================================
-- Script: 11-criar-historico-tarefas.sql
-- Objetivo: Tabela de auditoria de mudancas nas tarefas
-- ============================================================
USE u292823232_tesisflowdb;

CREATE TABLE IF NOT EXISTS HistoricoTarefas (
    Id              INT             NOT NULL AUTO_INCREMENT,
    TarefaId        INT             NOT NULL,
    Campo           VARCHAR(50)     NOT NULL,
    ValorAntigo     VARCHAR(2000)   NULL,
    ValorNovo       VARCHAR(2000)   NULL,
    UsuarioId       INT             NOT NULL,
    DataCriacao     DATETIME        NOT NULL,
    Ativo           TINYINT(1)      NOT NULL DEFAULT 1,
    PRIMARY KEY (Id),
    INDEX IX_HistoricoTarefas_TarefaId (TarefaId),
    CONSTRAINT FK_HistoricoTarefas_Tarefas_TarefaId
        FOREIGN KEY (TarefaId) REFERENCES Tarefas(Id)
        ON DELETE CASCADE
) ENGINE=InnoDB;
