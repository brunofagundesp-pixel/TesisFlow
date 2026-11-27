using TesisFlow.Core.Interfaces;
using TesisFlow.Modelo.DTOs;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Servicos.Atendimentos
{
    public class AtendimentoConsultar
    {
        private readonly IAtendimentoRepositorio _repositorio;

        public AtendimentoConsultar(IAtendimentoRepositorio repositorio)
        {
            _repositorio = repositorio;
        }

        public async Task<(IEnumerable<AtendimentoDTO> Itens, int Total)> ObterAsync(int? colegioId, int? status, string? busca, int top = 20, int skip = 0)
        {
            var (itens, total) = await _repositorio.ObterAsync(colegioId, status, busca, top, skip);
            return (itens.Select(Mapear).ToList(), total);
        }

        public async Task<AtendimentoDTO?> ObterPorIdAsync(int id)
        {
            var a = await _repositorio.ObterPorIdAsync(id);
            return a == null ? null : Mapear(a);
        }

        public async Task<IEnumerable<AtendimentoDTO>> ObterRetornosAsync(int usuarioId)
        {
            var retornos = await _repositorio.ObterRetornosPendentesAsync(usuarioId);
            return retornos.Select(Mapear).ToList();
        }

        internal static AtendimentoDTO Mapear(Atendimento a) => new()
        {
            Id = a.Id,
            ColegioId = a.ColegioId,
            ColegioNome = a.ColegioNome,
            Titulo = a.Titulo,
            Descricao = a.Descricao,
            Status = a.Status,
            NomeContato = a.NomeContato,
            UsuarioId = a.UsuarioId,
            UsuarioNome = a.UsuarioNome,
            UsuarioFoto = a.Usuario?.Foto,
            TipoInteracao = a.TipoInteracao,
            Canal = a.Canal,
            Resultado = a.Resultado,
            ContatoId = a.ContatoId,
            AtendimentoOrigemId = a.AtendimentoOrigemId,
            ProximoContatoData = a.ProximoContatoData,
            ProximoContatoHora = a.ProximoContatoHora,
            ProximoContatoMotivo = a.ProximoContatoMotivo,
            RetornoConcluido = a.RetornoConcluido,
            LembreteNivel = a.LembreteNivel,
            DataCriacao = a.DataCriacao.Kind == DateTimeKind.Utc
                ? a.DataCriacao
                : DateTime.SpecifyKind(a.DataCriacao, DateTimeKind.Utc),
            DataAtualizacao = a.DataAtualizacao,
        };
    }
}
