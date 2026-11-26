using TesisFlow.Core.Interfaces;

namespace TesisFlow.Core.Servicos.Atendimentos
{
    public class AtendimentoExcluir
    {
        private readonly IAtendimentoRepositorio _repositorio;

        public AtendimentoExcluir(IAtendimentoRepositorio repositorio)
        {
            _repositorio = repositorio;
        }

        public async Task ExcluirAsync(int id)
        {
            await _repositorio.ExcluirAsync(id);
        }
    }
}
