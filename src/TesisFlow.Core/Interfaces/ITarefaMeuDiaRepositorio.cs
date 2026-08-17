namespace TesisFlow.Core.Interfaces
{
    public interface ITarefaMeuDiaRepositorio
    {
        Task<IEnumerable<int>> ObterIdsAsync(int usuarioId);
        Task<bool> AlternarAsync(int tarefaId, int usuarioId);
    }
}
