using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Interfaces
{
    public interface IComentarioRepositorio
    {
        Task<IEnumerable<Comentario>> ObterPorTarefaAsync(int tarefaId);
        Task<Comentario?> ObterPorIdAsync(int id);
        Task<Comentario> AdicionarAsync(Comentario comentario);
        Task<Comentario> AtualizarAsync(Comentario comentario);
        Task CurtirAsync(int id);
        Task DescurtirAsync(int id);
        Task ExcluirAsync(int id);
    }
}
