using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Interfaces
{
    public interface INotificacaoRepositorio
    {
        Task<IEnumerable<Notificacao>> ObterPorUsuarioAsync(int usuarioId);
        Task<Notificacao> AdicionarAsync(Notificacao notificacao);
        Task MarcarComoLidaAsync(int id);
        Task MarcarTodasComoLidasAsync(int usuarioId);
    }
}
