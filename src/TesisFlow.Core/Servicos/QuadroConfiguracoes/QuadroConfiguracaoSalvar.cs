using TesisFlow.Core.Interfaces;
using TesisFlow.Modelo.DTOs;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Servicos.QuadroConfiguracoes
{
    public class QuadroConfiguracaoSalvar
    {
        private readonly IQuadroConfiguracaoRepositorio _repositorio;
        private readonly IProjetoRepositorio _projetoRepositorio;

        public QuadroConfiguracaoSalvar(IQuadroConfiguracaoRepositorio repositorio, IProjetoRepositorio projetoRepositorio)
        {
            _repositorio = repositorio;
            _projetoRepositorio = projetoRepositorio;
        }

        public async Task<IEnumerable<QuadroConfiguracaoDTO>> CriarParaProjetoAsync(int projetoId, IEnumerable<QuadroConfiguracaoSalvarDTO> dtos)
        {
            var projeto = await _projetoRepositorio.ObterPorIdAsync(projetoId)
                ?? throw new KeyNotFoundException("Projeto não encontrado.");

            var quadros = dtos.Select(dto => new QuadroConfiguracao
            {
                ProjetoId = projetoId,
                Status = dto.Status,
                Titulo = dto.Titulo,
                Ordem = dto.Ordem,
                Visivel = dto.Visivel,
            }).ToList();

            var criados = await _repositorio.AdicionarVariosAsync(quadros);
            return criados.Select(MapToDTO);
        }

        public async Task<IEnumerable<QuadroConfiguracaoDTO>> SubstituirQuadrosAsync(int projetoId, IEnumerable<QuadroConfiguracaoSalvarDTO> dtos)
        {
            await _repositorio.ExcluirPorProjetoAsync(projetoId);
            return await CriarParaProjetoAsync(projetoId, dtos);
        }

        public async Task<QuadroConfiguracaoDTO> AtualizarAsync(int id, QuadroConfiguracaoSalvarDTO dto)
        {
            var quadro = await _repositorio.ObterPorIdAsync(id)
                ?? throw new KeyNotFoundException("Quadro não encontrado.");

            quadro.Titulo = dto.Titulo;
            quadro.Status = dto.Status;
            quadro.Ordem = dto.Ordem;
            quadro.Visivel = dto.Visivel;

            var atualizado = await _repositorio.AtualizarAsync(quadro);
            return MapToDTO(atualizado);
        }

        private static QuadroConfiguracaoDTO MapToDTO(QuadroConfiguracao q) => new()
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
