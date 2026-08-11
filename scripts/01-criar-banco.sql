CREATE DATABASE IF NOT EXISTS TesisFlowDB
  CHARACTER SET utf8
  COLLATE utf8_general_ci;

USE TesisFlowDB;

CREATE TABLE IF NOT EXISTS Usuarios (
    Id              INT             NOT NULL AUTO_INCREMENT,
    Nome            VARCHAR(150)    NOT NULL,
    Email           VARCHAR(200)    NOT NULL,
    SenhaHash       VARCHAR(500)    NOT NULL,
    Foto            VARCHAR(1000)   NULL,
    Cargo           VARCHAR(100)    NULL,
    DataCriacao     DATETIME        NOT NULL,
    DataAtualizacao DATETIME        NULL,
    Ativo           TINYINT(1)      NOT NULL DEFAULT 1,
    PRIMARY KEY (Id),
    UNIQUE INDEX IX_Usuarios_Email (Email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Projetos (
    Id              INT             NOT NULL AUTO_INCREMENT,
    Nome            VARCHAR(200)    NOT NULL,
    Descricao       VARCHAR(2000)   NULL,
    Cor             VARCHAR(7)      NULL,
    Icone           VARCHAR(10)     NULL,
    LiderId         INT             NOT NULL,
    DataCriacao     DATETIME        NOT NULL,
    DataAtualizacao DATETIME        NULL,
    Ativo           TINYINT(1)      NOT NULL DEFAULT 1,
    PRIMARY KEY (Id),
    CONSTRAINT FK_Projetos_Usuarios_LiderId
        FOREIGN KEY (LiderId) REFERENCES Usuarios(Id)
        ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ProjetoMembros (
    Id              INT             NOT NULL AUTO_INCREMENT,
    ProjetoId       INT             NOT NULL,
    UsuarioId       INT             NOT NULL,
    Papel           INT             NOT NULL DEFAULT 1,
    DataCriacao     DATETIME        NOT NULL,
    DataAtualizacao DATETIME        NULL,
    Ativo           TINYINT(1)      NOT NULL DEFAULT 1,
    PRIMARY KEY (Id),
    UNIQUE INDEX IX_ProjetoMembros_ProjetoId_UsuarioId (ProjetoId, UsuarioId),
    CONSTRAINT FK_ProjetoMembros_Projetos_ProjetoId
        FOREIGN KEY (ProjetoId) REFERENCES Projetos(Id)
        ON DELETE CASCADE,
    CONSTRAINT FK_ProjetoMembros_Usuarios_UsuarioId
        FOREIGN KEY (UsuarioId) REFERENCES Usuarios(Id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Sprints (
    Id              INT             NOT NULL AUTO_INCREMENT,
    Nome            VARCHAR(200)    NOT NULL,
    Descricao       VARCHAR(2000)   NULL,
    DataInicio      DATETIME        NOT NULL,
    DataFim         DATETIME        NOT NULL,
    ProjetoId       INT             NOT NULL,
    DataCriacao     DATETIME        NOT NULL,
    DataAtualizacao DATETIME        NULL,
    Ativo           TINYINT(1)      NOT NULL DEFAULT 1,
    PRIMARY KEY (Id),
    CONSTRAINT FK_Sprints_Projetos_ProjetoId
        FOREIGN KEY (ProjetoId) REFERENCES Projetos(Id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Tarefas (
    Id              INT             NOT NULL AUTO_INCREMENT,
    Titulo          VARCHAR(300)    NOT NULL,
    Descricao       VARCHAR(5000)   NULL,
    Status          INT             NOT NULL DEFAULT 0,
    Prioridade      INT             NOT NULL DEFAULT 1,
    Tipo            INT             NOT NULL DEFAULT 0,
    Ordem           INT             NOT NULL DEFAULT 0,
    ProjetoId       INT             NOT NULL,
    SprintId        INT             NULL,
    ResponsavelId   INT             NULL,
    CriadorId       INT             NOT NULL,
    DataConclusao   DATETIME        NULL,
    DataCriacao     DATETIME        NOT NULL,
    DataAtualizacao DATETIME        NULL,
    Ativo           TINYINT(1)      NOT NULL DEFAULT 1,
    PRIMARY KEY (Id),
    CONSTRAINT FK_Tarefas_Projetos_ProjetoId
        FOREIGN KEY (ProjetoId) REFERENCES Projetos(Id)
        ON DELETE CASCADE,
    CONSTRAINT FK_Tarefas_Sprints_SprintId
        FOREIGN KEY (SprintId) REFERENCES Sprints(Id)
        ON DELETE SET NULL,
    CONSTRAINT FK_Tarefas_Usuarios_ResponsavelId
        FOREIGN KEY (ResponsavelId) REFERENCES Usuarios(Id)
        ON DELETE SET NULL,
    CONSTRAINT FK_Tarefas_Usuarios_CriadorId
        FOREIGN KEY (CriadorId) REFERENCES Usuarios(Id)
        ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Comentarios (
    Id              INT             NOT NULL AUTO_INCREMENT,
    Texto           VARCHAR(5000)   NOT NULL,
    TarefaId        INT             NOT NULL,
    UsuarioId       INT             NOT NULL,
    DataCriacao     DATETIME        NOT NULL,
    DataAtualizacao DATETIME        NULL,
    Ativo           TINYINT(1)      NOT NULL DEFAULT 1,
    PRIMARY KEY (Id),
    CONSTRAINT FK_Comentarios_Tarefas_TarefaId
        FOREIGN KEY (TarefaId) REFERENCES Tarefas(Id)
        ON DELETE CASCADE,
    CONSTRAINT FK_Comentarios_Usuarios_UsuarioId
        FOREIGN KEY (UsuarioId) REFERENCES Usuarios(Id)
        ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS QuadroConfiguracoes (
    Id              INT             NOT NULL AUTO_INCREMENT,
    ProjetoId       INT             NOT NULL,
    Status          INT             NOT NULL,
    Titulo          VARCHAR(100)    NOT NULL,
    Ordem           INT             NOT NULL DEFAULT 0,
    Visivel         TINYINT(1)      NOT NULL DEFAULT 1,
    DataCriacao     DATETIME        NOT NULL,
    DataAtualizacao DATETIME        NULL,
    Ativo           TINYINT(1)      NOT NULL DEFAULT 1,
    PRIMARY KEY (Id),
    UNIQUE INDEX IX_QuadroConfiguracoes_ProjetoId_Status (ProjetoId, Status),
    CONSTRAINT FK_QuadroConfiguracoes_Projetos_ProjetoId
        FOREIGN KEY (ProjetoId) REFERENCES Projetos(Id)
        ON DELETE CASCADE
) ENGINE=InnoDB;
