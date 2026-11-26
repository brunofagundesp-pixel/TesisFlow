-- Script: 31-crm-pipeline.sql
-- Evolucao do CRM (Fase B): etapa comercial por escola + historico de mudanca de etapa.
-- (A migracao automatica do Program.cs faz o mesmo ao subir a API. Rode este script apenas se precisar aplicar manualmente.)

CREATE TABLE IF NOT EXISTS EscolasCrm (
    Id INT NOT NULL AUTO_INCREMENT,
    ColegioId INT NOT NULL,
    ColegioNome VARCHAR(300) NOT NULL DEFAULT '',
    EtapaComercial INT NOT NULL DEFAULT 0,
    ResponsavelId INT NULL,
    ResponsavelNome VARCHAR(200) NULL,
    ContatoPrincipalId INT NULL,
    ContatoPrincipalNome VARCHAR(200) NULL,
    MotivoEncerramento VARCHAR(300) NULL,
    MotivoObservacao VARCHAR(500) NULL,
    DataConversao DATETIME NULL,
    DataCriacao DATETIME NOT NULL,
    DataAtualizacao DATETIME NULL,
    Ativo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (Id),
    UNIQUE INDEX IX_EscolasCrm_ColegioId (ColegioId),
    INDEX IX_EscolasCrm_EtapaComercial (EtapaComercial)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS EscolasCrmHistorico (
    Id INT NOT NULL AUTO_INCREMENT,
    EscolaCrmId INT NOT NULL,
    EtapaAnterior INT NOT NULL,
    EtapaNova INT NOT NULL,
    UsuarioId INT NOT NULL DEFAULT 0,
    UsuarioNome VARCHAR(200) NOT NULL DEFAULT '',
    DataCriacao DATETIME NOT NULL,
    DataAtualizacao DATETIME NULL,
    Ativo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (Id),
    INDEX IX_EscolasCrmHistorico_EscolaCrmId (EscolaCrmId)
) ENGINE=InnoDB;
