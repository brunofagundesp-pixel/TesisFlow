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
        Task<IEnumerable<Tarefa>> ObterPorMeuDiaAsync(int usuarioId);
        Task<Tarefa> AdicionarAsync(Tarefa tarefa);
        Task<Tarefa> AtualizarAsync(Tarefa tarefa);
        Task ExcluirAsync(int id);
        Task MoverAsync(int id, int ordem, int status);
        Task ReordenarAsync(IEnumerable<(int Id, int Ordem, int Status)> itens);
        Task<int> ObterMaiorOrdemAsync(int projetoId, StatusTarefa status);
        Task<IEnumerable<Tarefa>> BuscarAsync(string termo, int usuarioId);
        Task<Tarefa?> ObterPorIdIncluindoExcluidosAsync(int id);
        Task<IEnumerable<Tarefa>> ListarLixeiraAsync(int usuarioId);
        Task RestaurarAsync(int id);
        Task ExcluirDefinitivamenteAsync(int id);
        Task<int> LimparLixeiraAsync(DateTime limite);
    }
}
