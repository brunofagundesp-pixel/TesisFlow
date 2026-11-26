using TesisFlow.Core.Interfaces;
using TesisFlow.Modelo.DTOs;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Servicos.Atendimentos
{
    public class AtendimentoSalvar
    {
        private readonly IAtendimentoRepositorio _repositorio;

        public AtendimentoSalvar(IAtendimentoRepositorio repositorio)
        {
            _repositorio = repositorio;
        }

        public async Task<AtendimentoDTO> CriarAsync(AtendimentoSalvarDTO dto, int usuarioId, string usuarioNome)
        {
            var atendimento = new Atendimento
            {
                ColegioId = dto.ColegioId,
                ColegioNome = dto.ColegioNome ?? string.Empty,
                Titulo = dto.Titulo ?? string.Empty,
                Descricao = dto.Descricao ?? string.Empty,
                Status = dto.Status,
                NomeContato = dto.NomeContato,
                UsuarioId = usuarioId,
                UsuarioNome = usuarioNome ?? string.Empty,
                TipoInteracao = dto.TipoInteracao,
                Canal = dto.Canal,
                Resultado = dto.Resultado,
                ContatoId = dto.ContatoId,
                AtendimentoOrigemId = dto.AtendimentoOrigemId,
                ProximoContatoData = dto.ProximoContatoData,
                ProximoContatoHora = dto.ProximoContatoHora,
                ProximoContatoMotivo = dto.ProximoContatoMotivo,
                RetornoConcluido = dto.RetornoConcluido,
            };

            var salvo = await _repositorio.AdicionarAsync(atendimento);

            if (dto.AtendimentoOrigemId.HasValue)
                await _repositorio.ConcluirRetornoAsync(dto.AtendimentoOrigemId.Value);

            return AtendimentoConsultar.Mapear(salvo);
        }

        public async Task<AtendimentoDTO> AtualizarAsync(int id, AtendimentoSalvarDTO dto)
        {
            var atendimento = new Atendimento
            {
                Id = id,
                ColegioId = dto.ColegioId,
                ColegioNome = dto.ColegioNome ?? string.Empty,
                Titulo = dto.Titulo ?? string.Empty,
                Descricao = dto.Descricao ?? string.Empty,
                Status = dto.Status,
                NomeContato = dto.NomeContato,
                TipoInteracao = dto.TipoInteracao,
                Canal = dto.Canal,
                Resultado = dto.Resultado,
                ContatoId = dto.ContatoId,
                ProximoContatoData = dto.ProximoContatoData,
                ProximoContatoHora = dto.ProximoContatoHora,
                ProximoContatoMotivo = dto.ProximoContatoMotivo,
                RetornoConcluido = dto.RetornoConcluido,
            };

            var salvo = await _repositorio.AtualizarAsync(atendimento);
            return AtendimentoConsultar.Mapear(salvo);
        }
    }
}
