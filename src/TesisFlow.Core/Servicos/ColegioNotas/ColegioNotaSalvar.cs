using TesisFlow.Core.Interfaces;
using TesisFlow.Modelo.DTOs;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Servicos.ColegioNotas
{
    public class ColegioNotaSalvar
    {
        private readonly IColegioNotaRepositorio _repositorio;

        public ColegioNotaSalvar(IColegioNotaRepositorio repositorio)
        {
            _repositorio = repositorio;
        }

        public async Task<ColegioNotaDTO> CriarAsync(ColegioNotaSalvarDTO dto)
        {
            var nota = new ColegioNota
            {
                ColegioId = dto.ColegioId,
                Titulo = dto.Titulo ?? string.Empty,
                Conteudo = dto.Conteudo ?? string.Empty,
                Cor = dto.Cor ?? string.Empty,
                Fixa = dto.Fixa,
            };

            var salva = await _repositorio.AdicionarAsync(nota);
            return ColegioNotaConsultar.Mapear(salva);
        }

        public async Task<ColegioNotaDTO> AtualizarAsync(int id, ColegioNotaSalvarDTO dto)
        {
            var nota = new ColegioNota
            {
                Id = id,
                Titulo = dto.Titulo ?? string.Empty,
                Conteudo = dto.Conteudo ?? string.Empty,
                Cor = dto.Cor ?? string.Empty,
                Fixa = dto.Fixa,
            };

            var salva = await _repositorio.AtualizarAsync(nota);
            return ColegioNotaConsultar.Mapear(salva);
        }
    }
}
