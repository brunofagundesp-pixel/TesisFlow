using TesisFlow.Core.Interfaces;
using TesisFlow.Modelo.DTOs;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Servicos.Comentarios
{
    public class ComentarioSalvar
    {
        private readonly IComentarioRepositorio _repositorio;

        public ComentarioSalvar(IComentarioRepositorio repositorio)
        {
            _repositorio = repositorio;
        }

        public async Task<Comentario> CriarAsync(ComentarioSalvarDTO dto)
        {
            var comentario = new Comentario
            {
                Texto = dto.Texto,
                TarefaId = dto.TarefaId,
                UsuarioId = dto.UsuarioId,
                ComentarioPaiId = dto.ComentarioPaiId
            };

            return await _repositorio.AdicionarAsync(comentario);
        }

        public async Task CurtirAsync(int id)
        {
            await _repositorio.CurtirAsync(id);
        }

        public async Task DescurtirAsync(int id)
        {
            await _repositorio.DescurtirAsync(id);
        }

        public async Task<Comentario> AtualizarAsync(int id, ComentarioSalvarDTO dto)
        {
            var comentario = await _repositorio.ObterPorIdAsync(id)
                ?? throw new KeyNotFoundException("Comentario nao encontrado.");

            comentario.Texto = dto.Texto;
            return await _repositorio.AtualizarAsync(comentario);
        }
    }
}
