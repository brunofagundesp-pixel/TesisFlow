using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TesisFlow.Core.Servicos.Atendimentos;

namespace TesisFlow.Api.Services
{
    public class RetornoLembreteService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<RetornoLembreteService> _logger;
        private readonly TimeSpan _intervalo = TimeSpan.FromMinutes(1);

        public RetornoLembreteService(IServiceScopeFactory scopeFactory, ILogger<RetornoLembreteService> logger)
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
                    var servico = scope.ServiceProvider.GetRequiredService<RetornoLembreteServico>();
                    await servico.ProcessarLembretesAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erro ao processar lembretes de retorno do CRM");
                }

                await Task.Delay(_intervalo, stoppingToken);
            }
        }
    }
}
