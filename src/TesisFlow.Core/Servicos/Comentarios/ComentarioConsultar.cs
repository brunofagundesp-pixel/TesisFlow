using TesisFlow.Core.Interfaces;
using TesisFlow.Modelo.DTOs;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Servicos.Comentarios
{
    public class ComentarioConsultar
    {
        private readonly IComentarioRepositorio _repositorio;

        public ComentarioConsultar(IComentarioRepositorio repositorio)
        {
            _repositorio = repositorio;
        }

        public async Task<ComentariosPaginadoDTO> ObterPorTarefaPaginadoAsync(int tarefaId, int skip, int take)
        {
            var (comentarios, temMais) = await _repositorio.ObterPorTarefaPaginadoAsync(tarefaId, skip, take);
            return new ComentariosPaginadoDTO
            {
                Comentarios = comentarios.Select(MapToDTO).ToList(),
                TemMais = temMais
            };
        }

        private static ComentarioDTO MapToDTO(Comentario c) => new()
        {
            Id = c.Id,
            Texto = c.Texto,
            TarefaId = c.TarefaId,
            UsuarioId = c.UsuarioId,
            UsuarioNome = c.Usuario?.Nome ?? string.Empty,
            UsuarioFoto = c.Usuario?.Foto,
            ComentarioPaiId = c.ComentarioPaiId,
            Curtidas = c.Curtidas,
            DataCriacao = c.DataCriacao.Kind == DateTimeKind.Utc
                ? c.DataCriacao
                : DateTime.SpecifyKind(c.DataCriacao, DateTimeKind.Utc)
        };
    }
}
