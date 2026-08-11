using TesisFlow.Modelo.Entidades;
using TesisFlow.Modelo.Enums;

namespace TesisFlow.Core.Interfaces
{
    public interface ITarefaRepositorio
    {
        Task<IEnumerable<Tarefa>> ObterTodosAsync();
        Task<Tarefa?> ObterPorIdAsync(int id);
        Task<Tarefa?> ObterPorChaveAsync(string chave);
        Task<IEnumerable<Tarefa>> ObterPorProjetoAsync(int projetoId);
        Task<IEnumerable<Tarefa>> ObterPorSprintAsync(int sprintId);
        Task<IEnumerable<Tarefa>> ObterPorResponsavelAsync(int usuarioId);
        Task<Tarefa> AdicionarAsync(Tarefa tarefa);
        Task<Tarefa> AtualizarAsync(Tarefa tarefa);
        Task ExcluirAsync(int id);
        Task MoverAsync(int id, int ordem, int status);
        Task<int> ObterMaiorOrdemAsync(int projetoId, StatusTarefa status);
        Task<IEnumerable<Tarefa>> BuscarAsync(string termo, int usuarioId);
    }
}
