using TesisFlow.Core.Interfaces;
using TesisFlow.Modelo.DTOs;

namespace TesisFlow.Core.Servicos.QuadroConfiguracoes
{
    public class QuadroConfiguracaoConsultar
    {
        private readonly IQuadroConfiguracaoRepositorio _repositorio;

        public QuadroConfiguracaoConsultar(IQuadroConfiguracaoRepositorio repositorio)
        {
            _repositorio = repositorio;
        }

        public async Task<IEnumerable<QuadroConfiguracaoDTO>> ObterPorProjetoAsync(int projetoId)
        {
            var quadros = await _repositorio.ObterPorProjetoAsync(projetoId);
            return quadros.Select(MapToDTO);
        }

        private static QuadroConfiguracaoDTO MapToDTO(Modelo.Entidades.QuadroConfiguracao q) => new()
        {
            Id = q.Id,
            ProjetoId = q.ProjetoId,
            Status = q.Status,
            Titulo = q.Titulo,
            Ordem = q.Ordem,
            Visivel = q.Visivel,
        };
    }
}
