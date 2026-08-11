-- ============================================================
-- Script: 10-criar-anexos.sql
-- Objetivo: Tabela de anexos para tarefas
-- ============================================================
USE u292823232_tesisflowdb;

CREATE TABLE IF NOT EXISTS Anexos (
    Id              INT             NOT NULL AUTO_INCREMENT,
    TarefaId        INT             NOT NULL,
    NomeArquivo     VARCHAR(500)    NOT NULL,
    Caminho         VARCHAR(1000)   NOT NULL,
    Tipo            VARCHAR(100)    NOT NULL DEFAULT 'application/octet-stream',
    Tamanho         BIGINT          NOT NULL DEFAULT 0,
    UsuarioId       INT             NOT NULL,
    DataCriacao     DATETIME        NOT NULL,
    DataAtualizacao DATETIME        NULL,
    Ativo           TINYINT(1)      NOT NULL DEFAULT 1,
    PRIMARY KEY (Id),
    INDEX IX_Anexos_TarefaId (TarefaId),
    CONSTRAINT FK_Anexos_Tarefas_TarefaId
        FOREIGN KEY (TarefaId) REFERENCES Tarefas(Id)
        ON DELETE CASCADE,
    CONSTRAINT FK_Anexos_Usuarios_UsuarioId
        FOREIGN KEY (UsuarioId) REFERENCES Usuarios(Id)
        ON DELETE RESTRICT
) ENGINE=InnoDB;
