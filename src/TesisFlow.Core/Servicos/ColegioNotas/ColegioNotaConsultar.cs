using TesisFlow.Core.Interfaces;
using TesisFlow.Modelo.DTOs;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Servicos.ColegioNotas
{
    public class ColegioNotaConsultar
    {
        private readonly IColegioNotaRepositorio _repositorio;

        public ColegioNotaConsultar(IColegioNotaRepositorio repositorio)
        {
            _repositorio = repositorio;
        }

        public async Task<(IEnumerable<ColegioNotaDTO> Itens, int Total)> ObterPorColegioAsync(int colegioId, int top = 20, int skip = 0)
        {
            var (itens, total) = await _repositorio.ObterPorColegioAsync(colegioId, top, skip);
            return (itens.Select(Mapear).ToList(), total);
        }

        internal static ColegioNotaDTO Mapear(ColegioNota nota)
        {
            return new ColegioNotaDTO
            {
                Id = nota.Id,
                ColegioId = nota.ColegioId,
                Titulo = nota.Titulo,
                Conteudo = nota.Conteudo,
                Cor = nota.Cor,
                Fixa = nota.Fixa,
                ParceiroId = nota.ParceiroId,
                DataCriacao = nota.DataCriacao.Kind == DateTimeKind.Utc
                    ? nota.DataCriacao
                    : DateTime.SpecifyKind(nota.DataCriacao, DateTimeKind.Utc),
                DataAtualizacao = nota.DataAtualizacao,
                DataFixacao = nota.DataFixacao.HasValue
                    ? DateTime.SpecifyKind(nota.DataFixacao.Value, DateTimeKind.Utc)
                    : (DateTime?)null,
            };
        }
    }
}
