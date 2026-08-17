using TesisFlow.Modelo.DTOs;

namespace TesisFlow.Core.Interfaces
{
    public interface INotificacaoDispatcher
    {
        Task EnviarAsync(NotificacaoDTO notificacao);
    }
}
