using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Interfaces
{
    public interface IMensagemRepositorio
    {
        Task<IEnumerable<Mensagem>> ObterConversaAsync(int usuarioA, int usuarioB, int limite = 50);
        Task<IEnumerable<Mensagem>> ObterConversasRecentesAsync(int usuarioId);
        Task<Mensagem> AdicionarAsync(Mensagem mensagem);
        Task MarcarComoLidasAsync(int remetenteId, int destinatarioId);
    }
}
