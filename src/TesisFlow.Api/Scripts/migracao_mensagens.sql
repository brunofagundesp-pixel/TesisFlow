-- Migracao: Criar tabela Mensagens
-- Data: 2026-08-11
-- Execute no banco TesisFlowDB

CREATE TABLE IF NOT EXISTS Mensagens (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    RemetenteId INT NOT NULL,
    DestinatarioId INT NOT NULL,
    Texto VARCHAR(5000) NOT NULL,
    Lida TINYINT(1) NOT NULL DEFAULT 0,
    DataCriacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    DataAtualizacao TIMESTAMP NULL DEFAULT NULL,
    Ativo TINYINT(1) NOT NULL DEFAULT 1,
    INDEX IX_Mensagens_DestinatarioId (DestinatarioId),
    INDEX IX_Mensagens_DestinatarioId_DataCriacao (DestinatarioId, DataCriacao),
    CONSTRAINT FK_Mensagens_Remetente FOREIGN KEY (RemetenteId) REFERENCES Usuarios(Id) ON DELETE RESTRICT,
    CONSTRAINT FK_Mensagens_Destinatario FOREIGN KEY (DestinatarioId) REFERENCES Usuarios(Id) ON DELETE RESTRICT
);
