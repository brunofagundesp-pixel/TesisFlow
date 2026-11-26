using TesisFlow.Modelo.DTOs;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Interfaces
{
    public interface IUsuarioRepositorio
    {
        Task<IEnumerable<Usuario>> ObterTodosAsync();
        Task<Usuario?> ObterPorIdAsync(int id);
        Task<IEnumerable<Usuario>> ObterPorIdsAsync(IEnumerable<int> ids);
        Task<Usuario?> ObterPorEmailAsync(string email);
        Task<Usuario> AdicionarAsync(Usuario usuario);
        Task<Usuario> AtualizarAsync(Usuario usuario);
        Task ExcluirAsync(int id);
        Task<bool> EmailExisteAsync(string email);
    }
}
