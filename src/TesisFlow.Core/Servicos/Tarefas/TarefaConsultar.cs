using TesisFlow.Core.Interfaces;
using TesisFlow.Modelo.DTOs;

namespace TesisFlow.Core.Servicos.Tarefas
{
    public class TarefaConsultar
    {
        private readonly ITarefaRepositorio _repositorio;

        public TarefaConsultar(ITarefaRepositorio repositorio)
        {
            _repositorio = repositorio;
        }

        public async Task<TarefaDTO?> ObterPorChaveAsync(string chave)
        {
            var tarefa = await _repositorio.ObterPorChaveAsync(chave);
            return tarefa != null ? MapToDTO(tarefa) : null;
        }

        public async Task<IEnumerable<TarefaDTO>> ObterPorProjetoAsync(int projetoId)
        {
            var tarefas = await _repositorio.ObterPorProjetoAsync(projetoId);
            return tarefas.Select(MapToDTO);
        }

        public async Task<TarefaDTO?> ObterPorIdAsync(int id)
        {
            var tarefa = await _repositorio.ObterPorIdAsync(id);
            return tarefa != null ? MapToDTO(tarefa) : null;
        }

        public async Task<IEnumerable<TarefaDTO>> ObterPorSprintAsync(int sprintId)
        {
            var tarefas = await _repositorio.ObterPorSprintAsync(sprintId);
            return tarefas.Select(MapToDTO);
        }

        public async Task<IEnumerable<TarefaDTO>> ObterPorResponsavelAsync(int usuarioId)
        {
            var tarefas = await _repositorio.ObterPorResponsavelAsync(usuarioId);
            return tarefas.Select(MapToDTO);
        }

        public async Task<IEnumerable<TarefaDTO>> ObterPorMeuDiaAsync(int usuarioId)
        {
            var tarefas = await _repositorio.ObterPorMeuDiaAsync(usuarioId);
            return tarefas.Select(MapToDTO);
        }

        public async Task<IEnumerable<TarefaDTO>> ListarLixeiraAsync(int usuarioId)
        {
            var tarefas = await _repositorio.ListarLixeiraAsync(usuarioId);
            return tarefas.Select(MapToDTO);
        }

        public async Task<IEnumerable<TarefaDTO>> BuscarAsync(string termo, int usuarioId)
        {
            var tarefas = await _repositorio.BuscarAsync(termo, usuarioId);
            return tarefas.Select(MapToDTO);
        }

        private static TarefaDTO MapToDTO(Modelo.Entidades.Tarefa t) => new()
        {
            Id = t.Id,
            Titulo = t.Titulo,
            Chave = t.Chave,
            Descricao = t.Descricao,
            Status = t.Status,
            Prioridade = t.Prioridade,
            Tipo = t.CategoriaId,
            CategoriaNome = t.Categoria?.Nome ?? string.Empty,
            CategoriaIcone = t.Categoria?.Icone ?? string.Empty,
            CategoriaCor = t.Categoria?.Cor ?? string.Empty,
            Ordem = t.Ordem,
            ProjetoId = t.ProjetoId,
            ProjetoNome = t.Projeto?.Nome ?? string.Empty,
            SprintId = t.SprintId,
            SprintNome = t.Sprint?.Nome,
            Responsaveis = t.TarefaResponsaveis
                .Select(tr => new ResponsavelDTO { Id = tr.UsuarioId, Nome = tr.Usuario.Nome, Foto = tr.Usuario.Foto })
                .ToList(),
            CriadorId = t.CriadorId,
            CriadorNome = t.Criador?.Nome ?? string.Empty,
            ColegioId = t.ColegioId,
            ColegioNome = t.ColegioNome,
            ContatoNome = t.ContatoNome,
            DataConclusao = t.DataConclusao,
            DataEntrega = t.DataEntrega,
            DataCriacao = t.DataCriacao,
            DataAtualizacao = t.DataAtualizacao,
            DataExclusao = t.DataExclusao,
            QuantidadeComentarios = t.Comentarios?.Count ?? 0
        };
    }
}
