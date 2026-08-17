using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TesisFlow.Core.Servicos.Tarefas;

namespace TesisFlow.Api.Services
{
    public class TarefaLembreteService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<TarefaLembreteService> _logger;
        private readonly TimeSpan _intervalo = TimeSpan.FromMinutes(1);

        public TarefaLembreteService(IServiceScopeFactory scopeFactory, ILogger<TarefaLembreteService> logger)
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
                    using var scope = _scopeFactory.CreateScope();
                    var servico = scope.ServiceProvider.GetRequiredService<TarefaLembreteServico>();
                    await servico.ProcessarLembretesAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erro ao processar lembretes de prazo de tarefas");
                }

                await Task.Delay(_intervalo, stoppingToken);
            }
        }
    }
}
