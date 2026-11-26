using TesisFlow.Core.Interfaces;
using TesisFlow.Modelo.DTOs;
using TesisFlow.Modelo.Entidades;
using TesisFlow.Modelo.Enums;

namespace TesisFlow.Core.Servicos.Atendimentos
{
    public class EscolaCrmConsultar
    {
        private readonly IEscolaCrmRepositorio _repositorio;
        private readonly IAtendimentoRepositorio _atendimentoRepositorio;

        public EscolaCrmConsultar(IEscolaCrmRepositorio repositorio, IAtendimentoRepositorio atendimentoRepositorio)
        {
            _repositorio = repositorio;
            _atendimentoRepositorio = atendimentoRepositorio;
        }

        public async Task<IEnumerable<EscolaCrmDTO>> ObterTodosAsync()
        {
            var escolas = await _repositorio.ObterTodosAsync();
            var dtos = new List<EscolaCrmDTO>();

            foreach (var e in escolas)
            {
                var ultimo = await _atendimentoRepositorio.ObterUltimoContatoAsync(e.ColegioId);
                var proximo = await _atendimentoRepositorio.ObterProximoContatoPendenteAsync(e.ColegioId);
                dtos.Add(Mapear(e, ultimo, proximo));
            }

            return dtos;
        }

        public async Task<EscolaCrmDTO?> ObterPorColegioAsync(int colegioId)
        {
            var escola = await _repositorio.ObterPorColegioAsync(colegioId);
            if (escola == null) return null;

            var ultimo = await _atendimentoRepositorio.ObterUltimoContatoAsync(colegioId);
            var proximo = await _atendimentoRepositorio.ObterProximoContatoPendenteAsync(colegioId);
            return Mapear(escola, ultimo, proximo);
        }

        public async Task<EscolaCrmResumoDTO> ObterResumoAsync()
        {
            var escolas = await _repositorio.ObterTodosAsync();

            return new EscolaCrmResumoDTO
            {
                TotalProspeccao = escolas.Count(e => e.EtapaComercial != EtapaComercial.ClienteConquistado &&
                                                      e.EtapaComercial != EtapaComercial.OportunidadePerdida &&
                                                      e.EtapaComercial != EtapaComercial.NaoInteressado),
                NaoContatadas = escolas.Count(e => e.EtapaComercial == EtapaComercial.NaoContatada),
                EmAcompanhamento = escolas.Count(e => e.EtapaComercial == EtapaComercial.EmAcompanhamento),
                Interessadas = escolas.Count(e => e.EtapaComercial == EtapaComercial.Interessada),
                EmNegociacao = escolas.Count(e => e.EtapaComercial == EtapaComercial.EmNegociacao),
                ClientesConquistados = escolas.Count(e => e.EtapaComercial == EtapaComercial.ClienteConquistado),
                RetornosAtrasados = await _atendimentoRepositorio.ContarRetornosAtrasadosAsync(),
            };
        }

        private static EscolaCrmDTO Mapear(EscolaCrm e, DateTime? ultimoContato, DateTime? proximoContato) => new()
        {
            Id = e.Id,
            ColegioId = e.ColegioId,
            ColegioNome = e.ColegioNome,
            EtapaComercial = (int)e.EtapaComercial,
            ResponsavelId = e.ResponsavelId,
            ResponsavelNome = e.ResponsavelNome,
            ContatoPrincipalId = e.ContatoPrincipalId,
            ContatoPrincipalNome = e.ContatoPrincipalNome,
            MotivoEncerramento = e.MotivoEncerramento,
            MotivoObservacao = e.MotivoObservacao,
            DataConversao = e.DataConversao,
            UltimoContato = ultimoContato,
            ProximoContato = proximoContato,
            DataCriacao = e.DataCriacao.Kind == DateTimeKind.Utc
                ? e.DataCriacao
                : DateTime.SpecifyKind(e.DataCriacao, DateTimeKind.Utc),
            DataAtualizacao = e.DataAtualizacao,
        };
    }
}
