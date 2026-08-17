using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Interfaces
{
    public interface ICategoriaRepositorio
    {
        Task<IEnumerable<Categoria>> ObterPorProjetoAsync(int projetoId);
        Task<Categoria?> ObterPorIdAsync(int id);
        Task<Categoria> AdicionarAsync(Categoria categoria);
        Task<Categoria> AtualizarAsync(Categoria categoria);
        Task ExcluirAsync(int id);
    }
}
