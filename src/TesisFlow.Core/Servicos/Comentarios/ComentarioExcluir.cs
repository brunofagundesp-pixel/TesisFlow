using TesisFlow.Core.Interfaces;

namespace TesisFlow.Core.Servicos.Comentarios
{
    public class ComentarioExcluir
    {
        private readonly IComentarioRepositorio _repositorio;

        public ComentarioExcluir(IComentarioRepositorio repositorio)
        {
            _repositorio = repositorio;
        }

        public async Task ExcluirAsync(int id)
        {
            var comentario = await _repositorio.ObterPorIdAsync(id)
                ?? throw new KeyNotFoundException("Comentário não encontrado.");

            await _repositorio.ExcluirAsync(id);
        }
    }
}
