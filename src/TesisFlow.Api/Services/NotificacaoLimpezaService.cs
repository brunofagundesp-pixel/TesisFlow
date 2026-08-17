using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TesisFlow.Core.Interfaces;

namespace TesisFlow.Api.Services
{
    public class NotificacaoLimpezaService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<NotificacaoLimpezaService> _logger;
        private readonly TimeSpan _intervalo = TimeSpan.FromHours(24);
        private readonly int _diasRetencao = 30;

        public NotificacaoLimpezaService(IServiceScopeFactory scopeFactory, ILogger<NotificacaoLimpezaService> logger)
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
                    _logger.LogError(ex, "Erro ao limpar notificacoes antigas");
                }

                await Task.Delay(_intervalo, stoppingToken);
            }
        }

        private async Task LimparAsync()
        {
            using var scope = _scopeFactory.CreateScope();
            var repositorio = scope.ServiceProvider.GetRequiredService<INotificacaoRepositorio>();

            var removidos = await repositorio.LimparAntigasAsync(DateTime.UtcNow.AddDays(-_diasRetencao));

            if (removidos > 0)
            {
                _logger.LogInformation("Notificacoes: {Removidos} registro(s) removido(s) por retencao de {Dias} dias.", removidos, _diasRetencao);
            }
        }
    }
}
