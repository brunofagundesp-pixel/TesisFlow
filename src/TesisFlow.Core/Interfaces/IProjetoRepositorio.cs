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
        Task AdicionarMembroAsync(int projetoId, int usuarioId);
    }
}
