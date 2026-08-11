using TesisFlow.Core.Interfaces;

namespace TesisFlow.Core.Servicos.Sprints
{
    public class SprintExcluir
    {
        private readonly ISprintRepositorio _repositorio;

        public SprintExcluir(ISprintRepositorio repositorio)
        {
            _repositorio = repositorio;
        }

        public async Task ExcluirAsync(int id)
        {
            var sprint = await _repositorio.ObterPorIdAsync(id)
                ?? throw new KeyNotFoundException("Sprint não encontrada.");

            await _repositorio.ExcluirAsync(id);
        }
    }
}
