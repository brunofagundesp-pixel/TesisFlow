-- ============================================================
-- Script: 16-criar-categorias.sql
-- Objetivo: Criar a tabela Categorias (por projeto) + backfill
--           dos projetos/tarefas existentes (banco de PRODUCAO)
--           Idempotente: pode ser executado mais de uma vez.
-- ============================================================

USE u292823232_tesisflowdb;

CREATE TABLE IF NOT EXISTS Categorias (
    Id              INT             NOT NULL AUTO_INCREMENT,
    Nome            VARCHAR(100)    NOT NULL,
    Icone           VARCHAR(50)     NOT NULL,
    Cor             VARCHAR(20)     NOT NULL,
    ProjetoId       INT             NOT NULL,
    DataCriacao     DATETIME        NOT NULL,
    DataAtualizacao DATETIME        NULL,
    Ativo           TINYINT(1)      NOT NULL DEFAULT 1,
    PRIMARY KEY (Id),
    INDEX IX_Categorias_ProjetoId (ProjetoId)
) ENGINE=InnoDB;

START TRANSACTION;

INSERT INTO Categorias (Nome, Icone, Cor, ProjetoId, DataCriacao)
SELECT d.Nome, d.Icone, d.Cor, p.Id, NOW()
FROM Projetos p
CROSS JOIN (
    SELECT 'Tarefa' AS Nome, 'task_alt' AS Icone, '#ff8615' AS Cor
    UNION ALL SELECT 'Bug', 'bug_report', '#ef4444'
    UNION ALL SELECT 'Melhoria', 'auto_awesome', '#f59e0b'
    UNION ALL SELECT 'Historia', 'auto_stories', '#3d81f4'
) d
WHERE p.Ativo = 1
  AND NOT EXISTS (SELECT 1 FROM Categorias c WHERE c.ProjetoId = p.Id);

UPDATE Tarefas t
JOIN Categorias c ON c.ProjetoId = t.ProjetoId
    AND c.Nome = CASE t.Tipo
        WHEN 1 THEN 'Tarefa'
        WHEN 2 THEN 'Bug'
        WHEN 3 THEN 'Melhoria'
        WHEN 4 THEN 'Historia'
    END
SET t.Tipo = c.Id
WHERE t.Tipo IN (1, 2, 3, 4);

COMMIT;
