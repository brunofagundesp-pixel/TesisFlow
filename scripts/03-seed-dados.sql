-- ============================================================
-- Script: 03-seed-dados.sql
-- Objetivo: Popular dados de teste
-- DB: TesisFlowDB (MySQL 8.x)
-- Idempotente: pode rodar quantas vezes quiser
-- ============================================================

USE TesisFlowDB;

-- ============================================================
-- 1. Usuarios extras
-- ============================================================
INSERT IGNORE INTO Usuarios (Id, Nome, Email, SenhaHash, Cargo, DataCriacao, Ativo) VALUES
(2, 'Maria Silva', 'maria@teste.com', 'hash', 'Designer', NOW(), 1),
(3, 'Joao Santos', 'joao@teste.com', 'hash', 'QA', NOW(), 1);

-- ============================================================
-- 2. Projetos
-- ============================================================
INSERT IGNORE INTO Projetos (Id, Nome, Descricao, Cor, Icone, LiderId, DataCriacao, Ativo) VALUES
(100, 'TesisFlow', 'Plataforma de gestao de tarefas e projetos', '#ff8615', 'TF', 1, NOW(), 1),
(101, 'App Mobile', 'Aplicativo mobile para clientes', '#3d81f4', 'AM', 1, NOW(), 1),
(102, 'Site Institucional', 'Novo site da empresa', '#16a34a', 'SI', 2, NOW(), 1);

-- ============================================================
-- 3. Membros dos projetos
-- ============================================================
INSERT IGNORE INTO ProjetoMembros (ProjetoId, UsuarioId, Papel, DataCriacao, Ativo) VALUES
(100, 1, 1, NOW(), 1),
(100, 2, 2, NOW(), 1),
(100, 3, 2, NOW(), 1),
(101, 1, 1, NOW(), 1),
(101, 2, 2, NOW(), 1),
(102, 2, 1, NOW(), 1),
(102, 3, 2, NOW(), 1);

-- ============================================================
-- 4. QuadroConfiguracoes (5 colunas por projeto)
-- ============================================================
INSERT IGNORE INTO QuadroConfiguracoes (ProjetoId, Status, Titulo, Ordem, Visivel, DataCriacao, Ativo) VALUES
(100, 1, 'Backlog', 1, 1, NOW(), 1),
(100, 2, 'A Fazer', 2, 1, NOW(), 1),
(100, 3, 'Em Andamento', 3, 1, NOW(), 1),
(100, 4, 'Revisao', 4, 1, NOW(), 1),
(100, 5, 'Concluido', 5, 1, NOW(), 1),
(101, 1, 'Backlog', 1, 1, NOW(), 1),
(101, 2, 'A Fazer', 2, 1, NOW(), 1),
(101, 3, 'Em Andamento', 3, 1, NOW(), 1),
(101, 4, 'Revisao', 4, 1, NOW(), 1),
(101, 5, 'Concluido', 5, 1, NOW(), 1),
(102, 1, 'Backlog', 1, 1, NOW(), 1),
(102, 2, 'A Fazer', 2, 1, NOW(), 1),
(102, 3, 'Em Andamento', 3, 1, NOW(), 1),
(102, 4, 'Revisao', 4, 1, NOW(), 1),
(102, 5, 'Concluido', 5, 1, NOW(), 1);

-- ============================================================
-- 5. Sprints
-- ============================================================
INSERT IGNORE INTO Sprints (Id, Nome, Descricao, DataInicio, DataFim, ProjetoId, DataCriacao, Ativo) VALUES
(100, 'Sprint 1', 'Primeira sprint TesisFlow', CURDATE() - INTERVAL 14 DAY, CURDATE(), 100, NOW(), 1),
(101, 'Sprint 2', 'Segunda sprint TesisFlow', CURDATE(), CURDATE() + INTERVAL 14 DAY, 100, NOW(), 1),
(102, 'Sprint Mobile 1', 'Sprint inicial', CURDATE() - INTERVAL 7 DAY, CURDATE() + INTERVAL 7 DAY, 101, NOW(), 1);

-- ============================================================
-- 6. Tarefas (26 tarefas variadas)
-- ============================================================
INSERT IGNORE INTO Tarefas (Id, Titulo, Descricao, Status, Prioridade, Tipo, Ordem, ProjetoId, SprintId, ResponsavelId, CriadorId, DataConclusao, DataCriacao, DataAtualizacao, Ativo) VALUES
(100, 'Criar endpoint de autenticacao', 'Implementar login e registro com JWT', 3, 3, 1, 0, 100, 100, 1, 1, NULL, NOW() - INTERVAL 10 DAY, NOW() - INTERVAL 1 DAY, 1),
(101, 'Corrigir bug no login social', 'Login com Google esta retornando erro 500', 2, 4, 2, 1, 100, 100, 2, 1, NULL, NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 2 DAY, 1),
(102, 'Adicionar testes unitarios', 'Cobertura minima de 80% no core', 4, 2, 3, 2, 100, 100, 1, 2, NULL, NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 1 DAY, 1),
(103, 'Documentar API com Swagger', 'Documentacao completa de todos os endpoints', 1, 1, 1, 3, 100, 101, NULL, 1, NULL, NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 1 DAY, 1),
(104, 'Otimizar queries do dashboard', 'Dashboard esta lento com muitos dados', 3, 3, 3, 4, 100, 101, 3, 1, NULL, NOW() - INTERVAL 7 DAY, NOW() - INTERVAL 1 DAY, 1),
(105, 'Implementar drag and drop', 'Kanban board com Angular CDK', 5, 2, 4, 5, 100, 100, 1, 1, NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 15 DAY, NOW() - INTERVAL 1 DAY, 1),
(106, 'Subir ambiente de homologacao', 'Configurar Docker e pipeline CI/CD', 2, 3, 1, 6, 100, 100, 3, 2, NULL, NOW() - INTERVAL 4 DAY, NOW() - INTERVAL 1 DAY, 1),
(107, 'Refatorar modulo de tarefas', 'Separar responsabilidades no backend', 3, 2, 3, 7, 100, 101, 2, 1, NULL, NOW() - INTERVAL 6 DAY, NOW() - INTERVAL 1 DAY, 1),
(108, 'Criar tela de dashboard', 'Graficos e metricas do projeto', 1, 2, 1, 8, 100, 101, NULL, 3, NULL, NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY, 1),
(109, 'Configurar notificacoes', 'Email e push notifications', 2, 1, 4, 9, 100, NULL, 1, 1, NULL, NOW() - INTERVAL 8 DAY, NOW() - INTERVAL 1 DAY, 1),
(110, 'Relatorio de horas', 'Exportar relatorio em PDF e CSV', 5, 2, 1, 10, 100, 100, 1, 1, NOW() - INTERVAL 4 DAY, NOW() - INTERVAL 20 DAY, NOW() - INTERVAL 4 DAY, 1),

(111, 'Tela de login', 'UI da tela de login do app', 5, 3, 1, 0, 101, 102, 2, 2, NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 12 DAY, NOW() - INTERVAL 2 DAY, 1),
(112, 'Integrar API de pagamento', 'Stripe e PagSeguro', 3, 4, 4, 1, 101, 102, 1, 1, NULL, NOW() - INTERVAL 9 DAY, NOW() - INTERVAL 1 DAY, 1),
(113, 'Corrigir crash no iOS', 'App fecha ao abrir camera no iPhone 15', 2, 4, 2, 2, 101, 102, 1, 2, NULL, NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 1 DAY, 1),
(114, 'Modo offline', 'Cache local para funcionar sem internet', 1, 2, 3, 3, 101, NULL, 2, 1, NULL, NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY, 1),
(115, 'Push notifications nativas', 'Notificacoes iOS e Android', 5, 2, 1, 4, 101, 102, 1, 2, NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 20 DAY, NOW() - INTERVAL 5 DAY, 1),
(116, 'Melhorar performance', 'Lazy loading e otimizacao de imagens', 3, 2, 3, 5, 101, 102, 3, 2, NULL, NOW() - INTERVAL 4 DAY, NOW() - INTERVAL 1 DAY, 1),
(117, 'Dark mode', 'Suporte a tema escuro no app', 4, 1, 4, 6, 101, NULL, 2, 1, NULL, NOW() - INTERVAL 6 DAY, NOW() - INTERVAL 1 DAY, 1),

(118, 'Desenvolver landing page', 'Pagina inicial do site', 5, 2, 1, 0, 102, NULL, 2, 2, NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 20 DAY, NOW() - INTERVAL 3 DAY, 1),
(119, 'Otimizar SEO', 'Meta tags, sitemap e robots.txt', 3, 3, 3, 1, 102, NULL, 3, 2, NULL, NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 1 DAY, 1),
(120, 'Sistema de blog com CMS', 'Blog integrado ao site', 2, 2, 4, 2, 102, NULL, 2, 3, NULL, NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 1 DAY, 1),
(121, 'Formulario de contato', 'Form com validacao e envio de email', 5, 1, 1, 3, 102, NULL, 3, 2, NOW() - INTERVAL 7 DAY, NOW() - INTERVAL 25 DAY, NOW() - INTERVAL 7 DAY, 1),
(122, 'Galeria de fotos', 'Carrossel responsivo com lightbox', 1, 1, 1, 4, 102, NULL, NULL, 3, NULL, NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY, 1),
(123, 'Integrar Google Analytics', 'Tracking de eventos e page views', 4, 2, 3, 5, 102, NULL, 3, 2, NULL, NOW() - INTERVAL 4 DAY, NOW() - INTERVAL 1 DAY, 1),
(124, 'Pagina sobre nos', 'Conteudo institucional com timeline', 2, 1, 1, 6, 102, NULL, NULL, 2, NULL, NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 1 DAY, 1),
(125, 'Politica de privacidade', 'Documento legal conforme LGPD', 5, 1, 1, 7, 102, NULL, 2, 2, NOW() - INTERVAL 10 DAY, NOW() - INTERVAL 15 DAY, NOW() - INTERVAL 10 DAY, 1);
