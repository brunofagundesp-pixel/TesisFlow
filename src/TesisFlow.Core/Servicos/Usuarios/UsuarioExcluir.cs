using TesisFlow.Core.Interfaces;

namespace TesisFlow.Core.Servicos.Usuarios
{
    public class UsuarioExcluir
    {
        private readonly IUsuarioRepositorio _repositorio;

        public UsuarioExcluir(IUsuarioRepositorio repositorio)
        {
            _repositorio = repositorio;
        }

        public async Task ExcluirAsync(int id)
        {
            var usuario = await _repositorio.ObterPorIdAsync(id)
                ?? throw new KeyNotFoundException("Usuário não encontrado.");

            await _repositorio.ExcluirAsync(id);
        }
    }
}
