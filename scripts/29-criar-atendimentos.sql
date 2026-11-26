-- Script: 29-criar-atendimentos.sql
-- Cria a tabela de atendimentos (CRM local), vinculada ao colegio pelo idColegio da TesisCc.
-- (A migracao automatica do Program.cs faz o mesmo ao subir a API. Rode este script apenas se precisar aplicar manualmente.)

CREATE TABLE IF NOT EXISTS Atendimentos (
    Id INT NOT NULL AUTO_INCREMENT,
    ColegioId INT NOT NULL,
    ColegioNome VARCHAR(300) NOT NULL DEFAULT '',
    Titulo VARCHAR(300) NOT NULL DEFAULT '',
    Descricao TEXT NULL,
    Status INT NOT NULL DEFAULT 0,
    NomeContato VARCHAR(200) NULL,
    UsuarioId INT NOT NULL DEFAULT 0,
    UsuarioNome VARCHAR(200) NOT NULL DEFAULT '',
    DataCriacao DATETIME NOT NULL,
    DataAtualizacao DATETIME NULL,
    Ativo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (Id),
    INDEX IX_Atendimentos_ColegioId (ColegioId),
    INDEX IX_Atendimentos_Status (Status)
) ENGINE=InnoDB;
