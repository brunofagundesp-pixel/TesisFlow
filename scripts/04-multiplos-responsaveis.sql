-- ============================================================
-- Script: 04-multiplos-responsaveis.sql
-- Objetivo: Migrar de responsavel unico para multiplos
-- ============================================================

USE u292823232_tesisflowdb;

-- 1. Criar tabela de vinculo
CREATE TABLE IF NOT EXISTS TarefaResponsaveis (
    Id              INT             NOT NULL AUTO_INCREMENT,
    TarefaId        INT             NOT NULL,
    UsuarioId       INT             NOT NULL,
    DataCriacao     DATETIME        NOT NULL,
    Ativo           TINYINT(1)      NOT NULL DEFAULT 1,
    PRIMARY KEY (Id),
    UNIQUE INDEX IX_TarefaResponsaveis_TarefaId_UsuarioId (TarefaId, UsuarioId),
    INDEX IX_TarefaResponsaveis_UsuarioId (UsuarioId),
    CONSTRAINT FK_TarefaResponsaveis_Tarefas_TarefaId
        FOREIGN KEY (TarefaId) REFERENCES Tarefas(Id)
        ON DELETE CASCADE,
    CONSTRAINT FK_TarefaResponsaveis_Usuarios_UsuarioId
        FOREIGN KEY (UsuarioId) REFERENCES Usuarios(Id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- 2. Migrar dados existentes
INSERT IGNORE INTO TarefaResponsaveis (TarefaId, UsuarioId, DataCriacao, Ativo)
SELECT Id, ResponsavelId, NOW(), 1
FROM Tarefas
WHERE ResponsavelId IS NOT NULL;

-- 3. Remover FK e coluna antiga da tabela Tarefas
ALTER TABLE Tarefas
    DROP FOREIGN KEY FK_Tarefas_Usuarios_ResponsavelId;

ALTER TABLE Tarefas
    DROP INDEX IX_Tarefas_ResponsavelId;

ALTER TABLE Tarefas
    DROP COLUMN ResponsavelId;
