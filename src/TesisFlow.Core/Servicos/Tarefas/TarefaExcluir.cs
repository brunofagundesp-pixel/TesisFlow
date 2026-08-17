using TesisFlow.Core.Interfaces;
using TesisFlow.Core.Servicos.Integracoes;

namespace TesisFlow.Core.Servicos.Tarefas
{
    public class TarefaExcluir
    {
        private readonly ITarefaRepositorio _repositorio;
        private readonly TesisCcService _tesisCcService;

        public TarefaExcluir(ITarefaRepositorio repositorio, TesisCcService tesisCcService)
        {
            _repositorio = repositorio;
            _tesisCcService = tesisCcService;
        }

        public async Task ExcluirAsync(int id)
        {
            var tarefa = await _repositorio.ObterPorIdAsync(id)
                ?? throw new KeyNotFoundException("Tarefa não encontrada.");

            if (tarefa.ColegioId != null)
            {
                await _tesisCcService.ExcluirContatoAsync(tarefa.ContatoId, tarefa.ColegioId, tarefa.Chave);
            }

            await _repositorio.ExcluirAsync(id);
        }

        public async Task ExcluirDefinitivamenteAsync(int id)
        {
            var tarefa = await _repositorio.ObterPorIdIncluindoExcluidosAsync(id)
                ?? throw new KeyNotFoundException("Tarefa não encontrada.");

            await _repositorio.ExcluirDefinitivamenteAsync(id);
        }

        public async Task ExcluirEmMassaAsync(List<int> ids)
        {
            foreach (var id in ids)
            {
                var tarefa = await _repositorio.ObterPorIdAsync(id);
                if (tarefa == null) continue;

                if (tarefa.ColegioId != null)
                {
                    await _tesisCcService.ExcluirContatoAsync(tarefa.ContatoId, tarefa.ColegioId, tarefa.Chave);
                }

                await _repositorio.ExcluirAsync(id);
            }
        }

        public async Task<int> LimparLixeiraAsync(DateTime limite)
        {
            return await _repositorio.LimparLixeiraAsync(limite);
        }
    }
}
