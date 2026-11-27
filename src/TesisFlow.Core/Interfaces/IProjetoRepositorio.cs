using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Interfaces
{
    public interface IProjetoRepositorio
    {
        Task<IEnumerable<Projeto>> ObterTodosAsync();
        Task<Projeto?> ObterPorIdAsync(int id);
        Task<IEnumerable<Projeto>> ObterPorUsuarioAsync(int usuarioId);
        Task<Projeto> AdicionarAsync(Projeto projeto);
        Task<Projeto> AtualizarAsync(Projeto projeto);
        Task ExcluirAsync(int id);
        Task<Dictionary<int, int>> ObterQuantidadeTarefasAsync();
        Task<int> ObterQuantidadeTarefasAsync(int projetoId);
        Task AdicionarMembroAsync(int projetoId, int usuarioId);
        Task AceitarConviteAsync(int projetoId, int usuarioId);
        Task RecusarConviteAsync(int projetoId, int usuarioId);
    }
}
