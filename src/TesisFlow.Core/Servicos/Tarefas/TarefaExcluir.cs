using TesisFlow.Core.Interfaces;

namespace TesisFlow.Core.Servicos.Tarefas
{
    public class TarefaExcluir
    {
        private readonly ITarefaRepositorio _repositorio;

        public TarefaExcluir(ITarefaRepositorio repositorio)
        {
            _repositorio = repositorio;
        }

        public async Task ExcluirAsync(int id)
        {
            var tarefa = await _repositorio.ObterPorIdAsync(id)
                ?? throw new KeyNotFoundException("Tarefa não encontrada.");

            await _repositorio.ExcluirAsync(id);
        }
    }
}
