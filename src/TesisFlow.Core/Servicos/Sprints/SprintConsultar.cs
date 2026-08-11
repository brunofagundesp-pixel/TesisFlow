using TesisFlow.Core.Interfaces;
using TesisFlow.Modelo.DTOs;

namespace TesisFlow.Core.Servicos.Sprints
{
    public class SprintConsultar
    {
        private readonly ISprintRepositorio _repositorio;

        public SprintConsultar(ISprintRepositorio repositorio)
        {
            _repositorio = repositorio;
        }

        public async Task<IEnumerable<SprintDTO>> ObterPorProjetoAsync(int projetoId)
        {
            var sprints = await _repositorio.ObterPorProjetoAsync(projetoId);
            return sprints.Select(MapToDTO);
        }

        public async Task<SprintDTO?> ObterPorIdAsync(int id)
        {
            var sprint = await _repositorio.ObterPorIdAsync(id);
            return sprint != null ? MapToDTO(sprint) : null;
        }

        private static SprintDTO MapToDTO(Modelo.Entidades.Sprint s) => new()
        {
            Id = s.Id,
            Nome = s.Nome,
            Descricao = s.Descricao,
            DataInicio = s.DataInicio,
            DataFim = s.DataFim,
            ProjetoId = s.ProjetoId,
            ProjetoNome = s.Projeto?.Nome ?? string.Empty,
            Ativo = s.Ativo,
            QuantidadeTarefas = s.Tarefas?.Count ?? 0
        };
    }
}
