-- ============================================================
-- Script: 22-criar-tarefa-meu-dia.sql
-- Objetivo: Tabela de vinculo "Meu dia" (tarefas destacadas
--           por usuario, com reset diario)
-- ============================================================

USE u292823232_tesisflowdb;

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
