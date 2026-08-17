-- ============================================================
-- Script: 23-criar-tarefa-meu-dia-local.sql
-- Objetivo: Tabela de vinculo "Meu dia" - DEV
-- ============================================================

USE TesisFlowDB;

CREATE TABLE IF NOT EXISTS TarefasMeuDia (
    Id              INT             NOT NULL AUTO_INCREMENT,
    TarefaId        INT             NOT NULL,
    UsuarioId       INT             NOT NULL,
    Data            DATE            NOT NULL,
    DataCriacao     DATETIME        NOT NULL,
    DataAtualizacao DATETIME        NULL,
    Ativo           TINYINT(1)      NOT NULL DEFAULT 1,
    PRIMARY KEY (Id),
    UNIQUE INDEX IX_TarefasMeuDia_TarefaId_UsuarioId (TarefaId, UsuarioId),
    INDEX IX_TarefasMeuDia_UsuarioId (UsuarioId),
    CONSTRAINT FK_TarefasMeuDia_Tarefas_TarefaId
        FOREIGN KEY (TarefaId) REFERENCES Tarefas(Id)
        ON DELETE CASCADE,
    CONSTRAINT FK_TarefasMeuDia_Usuarios_UsuarioId
        FOREIGN KEY (UsuarioId) REFERENCES Usuarios(Id)
        ON DELETE CASCADE
) ENGINE=InnoDB;
