using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Interfaces
{
    public interface IContatoRepositorio
    {
        Task<IEnumerable<Contato>> ObterPorColegioAsync(int colegioId);
        Task<Contato?> ObterPorIdAsync(int id);
        Task<Contato> AdicionarAsync(Contato contato);
        Task<Contato> AtualizarAsync(Contato contato);
        Task ExcluirAsync(int id);
    }
}
