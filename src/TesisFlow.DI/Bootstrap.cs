using Microsoft.Extensions.DependencyInjection;
using TesisFlow.Core.Interfaces;
using TesisFlow.Core.Servicos.Categorias;
using TesisFlow.Core.Servicos.Comentarios;
using TesisFlow.Core.Servicos.Projetos;
using TesisFlow.Core.Servicos.QuadroConfiguracoes;
using TesisFlow.Core.Servicos.Sprints;
using TesisFlow.Core.Servicos.Tarefas;
using TesisFlow.Core.Servicos.Usuarios;
using TesisFlow.Core.Servicos.Notificacoes;
using TesisFlow.Core.Servicos.Mensagens;
using TesisFlow.Core.Servicos.Integracoes;
using TesisFlow.Core.Servicos.ColegioNotas;
using TesisFlow.Core.Servicos.Atendimentos;
using TesisFlow.Core.Servicos.Acesso;

namespace TesisFlow.DI
{
    public static class Bootstrap
    {
        public static void ConfigureServices(IServiceCollection services)
        {
            // Repositorios
            services.AddScoped<IUsuarioRepositorio, UsuarioRepositorio>();
            services.AddScoped<IProjetoRepositorio, ProjetoRepositorio>();
            services.AddScoped<ITarefaRepositorio, TarefaRepositorio>();
            services.AddScoped<ISprintRepositorio, SprintRepositorio>();
            services.AddScoped<IComentarioRepositorio, ComentarioRepositorio>();
            services.AddScoped<IQuadroConfiguracaoRepositorio, QuadroConfiguracaoRepositorio>();
            services.AddScoped<INotificacaoRepositorio, NotificacaoRepositorio>();
            services.AddScoped<IMensagemRepositorio, MensagemRepositorio>();
            services.AddScoped<ICategoriaRepositorio, CategoriaRepositorio>();
            services.AddScoped<ITarefaMeuDiaRepositorio, TarefaMeuDiaRepositorio>();
            services.AddScoped<IColegioNotaRepositorio, ColegioNotaRepositorio>();
            services.AddScoped<IAtendimentoRepositorio, AtendimentoRepositorio>();
            services.AddScoped<IContatoRepositorio, ContatoRepositorio>();
            services.AddScoped<IEscolaCrmRepositorio, EscolaCrmRepositorio>();

            // Servicos - Usuarios
            services.AddScoped<UsuarioConsultar>();
            services.AddScoped<UsuarioSalvar>();
            services.AddScoped<UsuarioExcluir>();

            // Servicos - Projetos
            services.AddScoped<ProjetoConsultar>();
            services.AddScoped<ProjetoSalvar>();
            services.AddScoped<ProjetoExcluir>();

            // Servicos - Tarefas
            services.AddScoped<TarefaConsultar>();
            services.AddScoped<TarefaSalvar>();
            services.AddScoped<TarefaExcluir>();
            services.AddScoped<TarefaLembreteServico>();

            // Servicos - Sprints
            services.AddScoped<SprintConsultar>();
            services.AddScoped<SprintSalvar>();
            services.AddScoped<SprintExcluir>();

            // Servicos - Comentarios
            services.AddScoped<ComentarioConsultar>();
            services.AddScoped<ComentarioSalvar>();
            services.AddScoped<ComentarioExcluir>();

            // Servicos - QuadroConfiguracoes
            services.AddScoped<QuadroConfiguracaoConsultar>();
            services.AddScoped<QuadroConfiguracaoSalvar>();

            // Servicos - Categorias
            services.AddScoped<CategoriaConsultar>();
            services.AddScoped<CategoriaSalvar>();
            services.AddScoped<CategoriaExcluir>();

            // Servicos - Meu dia
            services.AddScoped<TarefaMeuDiaServico>();

            // Servicos - Notificacoes
            services.AddScoped<NotificacaoConsultar>();
            services.AddScoped<NotificacaoSalvar>();
            services.AddScoped<NotificacaoServico>();

            // Servicos - Mensagens
            services.AddScoped<MensagemConsultar>();
            services.AddScoped<MensagemSalvar>();

            // Servicos - Integracoes externas
            services.AddScoped<TesisCcService>();

            // Servicos - ColegioNotas
            services.AddScoped<ColegioNotaConsultar>();
            services.AddScoped<ColegioNotaSalvar>();
            services.AddScoped<ColegioNotaExcluir>();
            services.AddScoped<ColegioNotaSincronizar>();

            // Servicos - Atendimentos (CRM)
            services.AddScoped<AtendimentoConsultar>();
            services.AddScoped<AtendimentoSalvar>();
            services.AddScoped<AtendimentoExcluir>();
            services.AddScoped<RetornoLembreteServico>();

            // Servicos - Contatos (CRM)
            services.AddScoped<ContatoConsultar>();
            services.AddScoped<ContatoSalvar>();
            services.AddScoped<ContatoExcluir>();

            // Servicos - EscolaCrm (pipeline)
            services.AddScoped<EscolaCrmConsultar>();
            services.AddScoped<EscolaCrmSalvar>();

            // Servicos - Acesso (verificacao de membro/lider)
            services.AddScoped<ProjetoAcessoService>();
        }
    }
}
