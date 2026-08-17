using Microsoft.EntityFrameworkCore;
using TesisFlow.Contexto.Contextos;
using TesisFlow.Core.Interfaces;

namespace TesisFlow.Core.Servicos.Categorias
{
    public class CategoriaExcluir
    {
        private readonly ICategoriaRepositorio _repositorio;
        private readonly ApplicationDbContextTesisFlow _context;

        public CategoriaExcluir(ICategoriaRepositorio repositorio, ApplicationDbContextTesisFlow context)
        {
            _repositorio = repositorio;
            _context = context;
        }

        public async Task ExcluirAsync(int id, int? novaCategoriaId)
        {
            var categoria = await _repositorio.ObterPorIdAsync(id)
                ?? throw new KeyNotFoundException("Categoria não encontrada.");

            if (novaCategoriaId != null)
            {
                if (novaCategoriaId == id)
                    throw new InvalidOperationException("A nova categoria deve ser diferente da categoria atual.");

                var novaCategoria = await _repositorio.ObterPorIdAsync(novaCategoriaId.Value)
                    ?? throw new KeyNotFoundException("Nova categoria não encontrada.");

                if (novaCategoria.ProjetoId != categoria.ProjetoId)
                    throw new InvalidOperationException("A nova categoria deve pertencer ao mesmo projeto.");

                await _context.Tarefas
                    .Where(t => t.CategoriaId == id && t.Ativo)
                    .ExecuteUpdateAsync(s => s.SetProperty(t => t.CategoriaId, novaCategoriaId.Value));
            }
            else
            {
                var possuiTarefas = await _context.Tarefas
                    .AnyAsync(t => t.CategoriaId == id && t.Ativo);

                if (possuiTarefas)
                    throw new InvalidOperationException("Existem tarefas vinculadas a esta categoria. Reatribua-as antes de excluir.");
            }

            await _repositorio.ExcluirAsync(id);
        }
    }
}
