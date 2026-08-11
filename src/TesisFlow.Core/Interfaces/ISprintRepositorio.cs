using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Interfaces
{
    public interface ISprintRepositorio
    {
        Task<IEnumerable<Sprint>> ObterTodosAsync();
        Task<Sprint?> ObterPorIdAsync(int id);
        Task<IEnumerable<Sprint>> ObterPorProjetoAsync(int projetoId);
        Task<Sprint> AdicionarAsync(Sprint sprint);
        Task<Sprint> AtualizarAsync(Sprint sprint);
        Task ExcluirAsync(int id);
    }
}
