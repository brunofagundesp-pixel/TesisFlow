-- Migracao: Criar tabela Notificacoes
-- Data: 2026-08-11
-- Execute no banco TesisFlowDB

CREATE TABLE IF NOT EXISTS Notificacoes (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Titulo VARCHAR(300) NOT NULL,
    Descricao VARCHAR(1000) NULL,
    Tipo VARCHAR(50) NOT NULL,
    Link VARCHAR(500) NULL,
    Lida TINYINT(1) NOT NULL DEFAULT 0,
    TargetUserId INT NULL,
    DataCriacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    DataAtualizacao TIMESTAMP NULL DEFAULT NULL,
    Ativo TINYINT(1) NOT NULL DEFAULT 1,
    INDEX IX_Notificacoes_TargetUserId (TargetUserId)
);
