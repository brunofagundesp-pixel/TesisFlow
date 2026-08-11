-- ============================================================
-- Script: 02-adicionar-indices.sql
-- Objetivo: Criar indices de performance para queries criticas
-- Compatibilidade: MySQL 8.x
-- ============================================================

-- Tarefas: composite index para a query principal do Kanban
-- (WHERE ProjetoId = ? AND Ativo = 1 ORDER BY Ordem)
CREATE INDEX IX_Tarefas_ProjetoId_Status_Ordem ON Tarefas (ProjetoId, Status, Ordem);

-- Tarefas: FK indexes
CREATE INDEX IX_Tarefas_SprintId ON Tarefas (SprintId);
CREATE INDEX IX_Tarefas_ResponsavelId ON Tarefas (ResponsavelId);
CREATE INDEX IX_Tarefas_CriadorId ON Tarefas (CriadorId);

-- Comentarios: FK index para queries por tarefa
CREATE INDEX IX_Comentarios_TarefaId ON Comentarios (TarefaId);

-- Sprints: FK index para queries por projeto
CREATE INDEX IX_Sprints_ProjetoId ON Sprints (ProjetoId);
