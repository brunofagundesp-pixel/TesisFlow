-- Script: 30-crm-contatos-retornos.sql
-- Evolucao do CRM: tabela de contatos por escola + novos campos de interacao/retorno em Atendimentos.
-- (A migracao automatica do Program.cs faz o mesmo ao subir a API. Rode este script apenas se precisar aplicar manualmente.)

CREATE TABLE IF NOT EXISTS Contatos (
    Id INT NOT NULL AUTO_INCREMENT,
    ColegioId INT NOT NULL,
    Nome VARCHAR(200) NOT NULL DEFAULT '',
    Telefone VARCHAR(50) NULL,
    Email VARCHAR(200) NULL,
    Cargo VARCHAR(100) NULL,
    DataCriacao DATETIME NOT NULL,
    DataAtualizacao DATETIME NULL,
    Ativo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (Id),
    INDEX IX_Contatos_ColegioId (ColegioId)
) ENGINE=InnoDB;

ALTER TABLE Atendimentos ADD COLUMN TipoInteracao INT NULL;
ALTER TABLE Atendimentos ADD COLUMN Canal INT NULL;
ALTER TABLE Atendimentos ADD COLUMN Resultado INT NULL;
ALTER TABLE Atendimentos ADD COLUMN ContatoId INT NULL;
ALTER TABLE Atendimentos ADD COLUMN AtendimentoOrigemId INT NULL;
ALTER TABLE Atendimentos ADD COLUMN ProximoContatoData DATETIME NULL;
ALTER TABLE Atendimentos ADD COLUMN ProximoContatoHora VARCHAR(10) NULL;
ALTER TABLE Atendimentos ADD COLUMN ProximoContatoMotivo VARCHAR(300) NULL;
ALTER TABLE Atendimentos ADD COLUMN RetornoConcluido TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE Atendimentos ADD COLUMN LembreteNivel INT NOT NULL DEFAULT 0;
