-- ============================================================
-- Script: 12-criar-reacoes.sql
-- Objetivo: Tabela de reacoes (emojis) nos comentarios
-- ============================================================
USE TesisFlowDB;

CREATE TABLE IF NOT EXISTS ComentarioReacoes (
    Id              INT             NOT NULL AUTO_INCREMENT,
    ComentarioId    INT             NOT NULL,
    UsuarioId       INT             NOT NULL,
    Emoji           VARCHAR(10)     NOT NULL,
    DataCriacao     DATETIME        NOT NULL,
    Ativo           TINYINT(1)      NOT NULL DEFAULT 1,
    PRIMARY KEY (Id),
    UNIQUE INDEX IX_ComentarioReacoes_ComentarioId_UsuarioId (ComentarioId, UsuarioId),
    CONSTRAINT FK_ComentarioReacoes_Comentarios_ComentarioId
        FOREIGN KEY (ComentarioId) REFERENCES Comentarios(Id)
        ON DELETE CASCADE,
    CONSTRAINT FK_ComentarioReacoes_Usuarios_UsuarioId
        FOREIGN KEY (UsuarioId) REFERENCES Usuarios(Id)
        ON DELETE CASCADE
) ENGINE=InnoDB;
