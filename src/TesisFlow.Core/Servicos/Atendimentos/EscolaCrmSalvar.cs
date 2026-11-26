using TesisFlow.Core.Interfaces;
using TesisFlow.Modelo.DTOs;
using TesisFlow.Modelo.Entidades;
using TesisFlow.Modelo.Enums;

namespace TesisFlow.Core.Servicos.Atendimentos
{
    public class EscolaCrmSalvar
    {
        private readonly IEscolaCrmRepositorio _repositorio;

        public EscolaCrmSalvar(IEscolaCrmRepositorio repositorio)
        {
            _repositorio = repositorio;
        }

        public async Task<EscolaCrm> CriarAsync(EscolaCrmSalvarDTO dto)
        {
            var escolaCrm = new EscolaCrm
            {
                ColegioId = dto.ColegioId,
                ColegioNome = dto.ColegioNome ?? string.Empty,
                EtapaComercial = (EtapaComercial)dto.EtapaComercial,
                ResponsavelId = dto.ResponsavelId,
                ResponsavelNome = dto.ResponsavelNome,
                ContatoPrincipalId = dto.ContatoPrincipalId,
                ContatoPrincipalNome = dto.ContatoPrincipalNome,
                MotivoEncerramento = dto.MotivoEncerramento,
                MotivoObservacao = dto.MotivoObservacao,
                DataConversao = dto.DataConversao,
            };

            return await _repositorio.AdicionarAsync(escolaCrm);
        }

        public async Task<EscolaCrm> AtualizarAsync(int id, EscolaCrmSalvarDTO dto, int usuarioId, string usuarioNome)
        {
            var escolaCrm = new EscolaCrm
            {
                Id = id,
                ColegioNome = dto.ColegioNome ?? string.Empty,
                EtapaComercial = (EtapaComercial)dto.EtapaComercial,
                ResponsavelId = dto.ResponsavelId,
                ResponsavelNome = dto.ResponsavelNome,
                ContatoPrincipalId = dto.ContatoPrincipalId,
                ContatoPrincipalNome = dto.ContatoPrincipalNome,
                MotivoEncerramento = dto.MotivoEncerramento,
                MotivoObservacao = dto.MotivoObservacao,
                DataConversao = dto.DataConversao,
            };

            return await _repositorio.AtualizarAsync(escolaCrm, usuarioId, usuarioNome);
        }

        public async Task<EscolaCrm?> ObterOuCriarAsync(int colegioId, string colegioNome, int usuarioId, string usuarioNome, int? contatoId, string? contatoNome)
        {
            var existente = await _repositorio.ObterPorColegioAsync(colegioId);
            if (existente != null)
                return existente;

            var inativo = await _repositorio.ObterPorColegioIncluindoInativoAsync(colegioId);
            if (inativo != null)
            {
                inativo.ColegioNome = colegioNome ?? string.Empty;
                inativo.EtapaComercial = EtapaComercial.PrimeiroContato;
                inativo.ResponsavelId = usuarioId;
                inativo.ResponsavelNome = usuarioNome ?? string.Empty;
                inativo.ContatoPrincipalId = contatoId;
                inativo.ContatoPrincipalNome = contatoNome;
                return await _repositorio.ReativarAsync(inativo);
            }

            var escolaCrm = new EscolaCrm
            {
                ColegioId = colegioId,
                ColegioNome = colegioNome ?? string.Empty,
                EtapaComercial = EtapaComercial.PrimeiroContato,
                ResponsavelId = usuarioId,
                ResponsavelNome = usuarioNome ?? string.Empty,
                ContatoPrincipalId = contatoId,
                ContatoPrincipalNome = contatoNome,
            };

            return await _repositorio.AdicionarAsync(escolaCrm);
        }

        public async Task ExcluirAsync(int id)
        {
            await _repositorio.ExcluirAsync(id);
        }
    }
}
