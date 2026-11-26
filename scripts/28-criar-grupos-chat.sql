-- Script: 28-criar-grupos-chat.sql
-- Cria as tabelas de grupo de chat, adiciona Mensagens.GrupoId e torna DestinatarioId nullable.
-- (A migracao automatica do Program.cs faz o mesmo ao subir a API. Rode este script apenas se precisar aplicar manualmente.)

CREATE TABLE IF NOT EXISTS GrupoChats (
    Id INT NOT NULL AUTO_INCREMENT,
    CriadorId INT NOT NULL,
    Nome VARCHAR(300) NOT NULL DEFAULT '',
    DataCriacao DATETIME NOT NULL,
    DataAtualizacao DATETIME NULL,
    Ativo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (Id),
    INDEX IX_GrupoChats_CriadorId (CriadorId)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS GrupoChatParticipantes (
    Id INT NOT NULL AUTO_INCREMENT,
    GrupoId INT NOT NULL,
    UsuarioId INT NOT NULL,
    DataCriacao DATETIME NOT NULL,
    DataAtualizacao DATETIME NULL,
    Ativo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (Id),
    INDEX IX_GrupoChatParticipantes_GrupoId (GrupoId),
    INDEX IX_GrupoChatParticipantes_UsuarioId (UsuarioId),
    UNIQUE INDEX IX_GrupoChatParticipantes_GrupoUsuario (GrupoId, UsuarioId)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS MensagemLeituras (
    Id INT NOT NULL AUTO_INCREMENT,
    MensagemId INT NOT NULL,
    UsuarioId INT NOT NULL,
    DataCriacao DATETIME NOT NULL,
    DataAtualizacao DATETIME NULL,
    Ativo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (Id),
    INDEX IX_MensagemLeituras_MensagemId (MensagemId),
    INDEX IX_MensagemLeituras_UsuarioId (UsuarioId),
    UNIQUE INDEX IX_MensagemLeituras_MensagemUsuario (MensagemId, UsuarioId)
) ENGINE=InnoDB;

-- Coluna GrupoId em Mensagens (execute uma vez; se a coluna ja existir, ignore o erro "Duplicate column name")
ALTER TABLE Mensagens ADD COLUMN GrupoId INT NULL;

-- Tornar DestinatarioId nullable (o nome da FK e FK_Mensagens_Destinatario)
ALTER TABLE Mensagens DROP FOREIGN KEY FK_Mensagens_Destinatario;
ALTER TABLE Mensagens MODIFY COLUMN DestinatarioId INT NULL;
ALTER TABLE Mensagens ADD CONSTRAINT FK_Mensagens_Destinatario FOREIGN KEY (DestinatarioId) REFERENCES Usuarios(Id) ON DELETE RESTRICT;
