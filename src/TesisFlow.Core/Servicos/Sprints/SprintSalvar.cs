using TesisFlow.Core.Interfaces;
using TesisFlow.Modelo.DTOs;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Servicos.Sprints
{
    public class SprintSalvar
    {
        private readonly ISprintRepositorio _repositorio;
        private readonly IProjetoRepositorio _projetoRepositorio;

        public SprintSalvar(ISprintRepositorio repositorio, IProjetoRepositorio projetoRepositorio)
        {
            _repositorio = repositorio;
            _projetoRepositorio = projetoRepositorio;
        }

        public async Task<Sprint> CriarAsync(SprintSalvarDTO dto)
        {
            var projeto = await _projetoRepositorio.ObterPorIdAsync(dto.ProjetoId)
                ?? throw new KeyNotFoundException("Projeto não encontrado.");

            var sprint = new Sprint
            {
                Nome = dto.Nome,
                Descricao = dto.Descricao,
                DataInicio = dto.DataInicio,
                DataFim = dto.DataFim,
                ProjetoId = dto.ProjetoId
            };

            return await _repositorio.AdicionarAsync(sprint);
        }

        public async Task<Sprint> AtualizarAsync(int id, SprintSalvarDTO dto)
        {
            var sprint = await _repositorio.ObterPorIdAsync(id)
                ?? throw new KeyNotFoundException("Sprint não encontrada.");

            sprint.Nome = dto.Nome;
            sprint.Descricao = dto.Descricao;
            sprint.DataInicio = dto.DataInicio;
            sprint.DataFim = dto.DataFim;
            sprint.ProjetoId = dto.ProjetoId;

            return await _repositorio.AtualizarAsync(sprint);
        }
    }
}
