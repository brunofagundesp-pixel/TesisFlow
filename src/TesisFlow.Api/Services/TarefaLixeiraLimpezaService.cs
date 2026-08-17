using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TesisFlow.Core.Servicos.Tarefas;

namespace TesisFlow.Api.Services
{
    public class TarefaLixeiraLimpezaService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<TarefaLixeiraLimpezaService> _logger;
        private readonly TimeSpan _intervalo = TimeSpan.FromHours(24);
        private readonly int _diasRetencao = 30;

        public TarefaLixeiraLimpezaService(IServiceScopeFactory scopeFactory, ILogger<TarefaLixeiraLimpezaService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await LimparAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erro ao limpar lixeira de tarefas");
                }

                await Task.Delay(_intervalo, stoppingToken);
            }
        }

        private async Task LimparAsync()
        {
            using var scope = _scopeFactory.CreateScope();
            var tarefaExcluir = scope.ServiceProvider.GetRequiredService<TarefaExcluir>();

            var removidos = await tarefaExcluir.LimparLixeiraAsync(DateTime.UtcNow.AddDays(-_diasRetencao));

            if (removidos > 0)
            {
                _logger.LogInformation("Lixeira: {Removidos} tarefa(s) excluída(s) definitivamente.", removidos);
            }
        }
    }
}
