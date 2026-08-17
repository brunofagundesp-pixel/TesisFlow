using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Interfaces
{
    public interface IMensagemRepositorio
    {
        Task<IEnumerable<Mensagem>> ObterConversaAsync(int usuarioA, int usuarioB, int limite = 50);
        Task<IEnumerable<Mensagem>> ObterConversasRecentesAsync(int usuarioId);
        Task<Mensagem> AdicionarAsync(Mensagem mensagem);
        Task<List<int>> MarcarComoLidasAsync(int remetenteId, int destinatarioId);
        Task<int?> MarcarEntregueAsync(int mensagemId, int destinatarioId);
    }
}
