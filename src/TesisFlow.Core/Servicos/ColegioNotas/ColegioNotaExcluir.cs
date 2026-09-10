using TesisFlow.Core.Interfaces;

namespace TesisFlow.Core.Servicos.ColegioNotas
{
    public class ColegioNotaExcluir
    {
        private readonly IColegioNotaRepositorio _repositorio;

        public ColegioNotaExcluir(IColegioNotaRepositorio repositorio)
        {
            _repositorio = repositorio;
        }

        public async Task ExcluirAsync(int id)
        {
            await _repositorio.ExcluirAsync(id);
        }
    }
}
