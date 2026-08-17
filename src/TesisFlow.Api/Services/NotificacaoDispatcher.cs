using Microsoft.AspNetCore.SignalR;
using TesisFlow.Api.Hubs;
using TesisFlow.Core.Interfaces;
using TesisFlow.Modelo.DTOs;

namespace TesisFlow.Api.Services
{
    public class NotificacaoDispatcher : INotificacaoDispatcher
    {
        private readonly IHubContext<NotificacaoHub> _hubContext;

        public NotificacaoDispatcher(IHubContext<NotificacaoHub> hubContext)
        {
            _hubContext = hubContext;
        }

        public async Task EnviarAsync(NotificacaoDTO notificacao)
        {
            if (notificacao.TargetUserId.HasValue)
            {
                await _hubContext.Clients
                    .Group($"user_{notificacao.TargetUserId.Value}")
                    .SendAsync("ReceberNotificacao", notificacao);
            }
            else
            {
                await _hubContext.Clients.All.SendAsync("ReceberNotificacao", notificacao);
            }
        }
    }
}
