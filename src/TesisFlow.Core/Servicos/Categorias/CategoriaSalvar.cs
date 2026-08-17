using TesisFlow.Core.Interfaces;
using TesisFlow.Modelo.DTOs;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Servicos.Categorias
{
    public class CategoriaSalvar
    {
        private readonly ICategoriaRepositorio _repositorio;

        public CategoriaSalvar(ICategoriaRepositorio repositorio)
        {
            _repositorio = repositorio;
        }

        public async Task<Categoria> CriarAsync(CategoriaSalvarDTO dto)
        {
            var categoria = new Categoria
            {
                Nome = dto.Nome,
                Icone = dto.Icone,
                Cor = dto.Cor,
                ProjetoId = dto.ProjetoId
            };

            return await _repositorio.AdicionarAsync(categoria);
        }

        public async Task<Categoria> AtualizarAsync(int id, CategoriaSalvarDTO dto)
        {
            var categoria = await _repositorio.ObterPorIdAsync(id)
                ?? throw new KeyNotFoundException("Categoria não encontrada.");

            categoria.Nome = dto.Nome;
            categoria.Icone = dto.Icone;
            categoria.Cor = dto.Cor;

            return await _repositorio.AtualizarAsync(categoria);
        }
    }
}
