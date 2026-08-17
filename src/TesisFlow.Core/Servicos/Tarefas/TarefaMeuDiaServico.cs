using TesisFlow.Core.Interfaces;

namespace TesisFlow.Core.Servicos.Tarefas
{
    public class TarefaMeuDiaServico
    {
        private readonly ITarefaMeuDiaRepositorio _repositorio;

        public TarefaMeuDiaServico(ITarefaMeuDiaRepositorio repositorio)
        {
            _repositorio = repositorio;
        }

        public async Task<IEnumerable<int>> ObterIdsAsync(int usuarioId)
        {
            return await _repositorio.ObterIdsAsync(usuarioId);
        }

        public async Task<bool> AlternarAsync(int tarefaId, int usuarioId)
        {
            return await _repositorio.AlternarAsync(tarefaId, usuarioId);
        }
    }
}
