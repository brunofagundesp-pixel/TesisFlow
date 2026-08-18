-- Migracao: Adicionar coluna MensagemRespondidaId na tabela Mensagens
-- Data: 2026-08-17
-- Execute no banco u292823232_tesisflowdb
-- (A coluna também é aplicada automaticamente no startup via Program.cs)

ALTER TABLE Mensagens ADD COLUMN MensagemRespondidaId INT NULL AFTER AudioDuracao;

-- FK auto-referente (opcional, para integridade)
ALTER TABLE Mensagens
  ADD CONSTRAINT FK_Mensagens_Respondida
  FOREIGN KEY (MensagemRespondidaId) REFERENCES Mensagens(Id) ON DELETE SET NULL;
