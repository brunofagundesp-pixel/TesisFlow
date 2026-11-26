using TesisFlow.Core.Interfaces;

namespace TesisFlow.Core.Servicos.Atendimentos
{
    public class ContatoExcluir
    {
        private readonly IContatoRepositorio _repositorio;

        public ContatoExcluir(IContatoRepositorio repositorio)
        {
            _repositorio = repositorio;
        }

        public async Task ExcluirAsync(int id)
        {
            await _repositorio.ExcluirAsync(id);
        }
    }
}
