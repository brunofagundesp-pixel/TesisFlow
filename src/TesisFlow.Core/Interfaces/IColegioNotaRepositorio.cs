using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Interfaces
{
    public interface IColegioNotaRepositorio
    {
        Task<(IEnumerable<ColegioNota> Itens, int Total)> ObterPorColegioAsync(int colegioId, int top, int skip);
        Task<HashSet<int>> ObterParceiroIdsAsync(int colegioId);
        Task<ColegioNota> AdicionarAsync(ColegioNota nota);
        Task<ColegioNota> AtualizarAsync(ColegioNota nota);
        Task ExcluirAsync(int id);
    }
}
