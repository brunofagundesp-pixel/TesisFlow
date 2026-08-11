using TesisFlow.Core.Interfaces;

namespace TesisFlow.Core.Servicos.Projetos
{
    public class ProjetoExcluir
    {
        private readonly IProjetoRepositorio _repositorio;

        public ProjetoExcluir(IProjetoRepositorio repositorio)
        {
            _repositorio = repositorio;
        }

        public async Task ExcluirAsync(int id)
        {
            var projeto = await _repositorio.ObterPorIdAsync(id)
                ?? throw new KeyNotFoundException("Projeto não encontrado.");

            await _repositorio.ExcluirAsync(id);
        }
    }
}
