using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Interfaces
{
    public interface IMensagemRepositorio
    {
        Task<IEnumerable<Mensagem>> ObterConversaAsync(int usuarioA, int usuarioB, int? antesId = null, int limite = 50);
        Task<Mensagem?> ObterPorIdAsync(int id);
        Task<IEnumerable<Mensagem>> ObterConversasRecentesAsync(int usuarioId);
        Task<IEnumerable<Mensagem>> BuscarAsync(int usuarioId, string termo, int? contatoId = null, int limite = 50);
        Task<Mensagem> AdicionarAsync(Mensagem mensagem);
        Task<List<int>> MarcarComoLidasAsync(int remetenteId, int destinatarioId);
        Task<int?> MarcarEntregueAsync(int mensagemId, int destinatarioId);

        Task<GrupoChat> AdicionarGrupoAsync(GrupoChat grupo);
        Task AdicionarParticipantesAsync(IEnumerable<GrupoChatParticipante> participantes);
        Task<GrupoChat?> ObterGrupoAsync(int grupoId);
        Task<IEnumerable<GrupoChat>> ObterGruposDoUsuarioAsync(int usuarioId);
        Task<bool> UsuarioEhParticipanteAsync(int grupoId, int usuarioId);
        Task<IEnumerable<Mensagem>> ObterConversaGrupoAsync(int grupoId, int? antesId = null, int limite = 50);
        Task<int> ContarParticipantesGrupoAsync(int grupoId);
        Task<Dictionary<int, int>> ObterContagemLeiturasGrupoAsync(int grupoId);
        Task<int> ContarNaoLidasGrupoAsync(int grupoId, int usuarioId);
        Task<Mensagem?> ObterUltimaMensagemGrupoAsync(int grupoId);
        Task<List<int>> MarcarGrupoLidasAsync(int grupoId, int usuarioId);
        Task<Mensagem> AdicionarMensagemGrupoAsync(Mensagem mensagem, int grupoId);
        Task<bool> RemoverParticipanteAsync(int grupoId, int usuarioId);
        Task<bool> AdicionarParticipanteAsync(int grupoId, int usuarioId);
    }
}
