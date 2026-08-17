using Microsoft.EntityFrameworkCore;
using TesisFlow.Contexto.Contextos;
using TesisFlow.Core.Interfaces;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Servicos.Categorias
{
    public class CategoriaRepositorio : ICategoriaRepositorio
    {
        private readonly ApplicationDbContextTesisFlow _context;

        public CategoriaRepositorio(ApplicationDbContextTesisFlow context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Categoria>> ObterPorProjetoAsync(int projetoId)
        {
            return await _context.Categorias
                .Where(c => c.Ativo && c.ProjetoId == projetoId)
                .OrderBy(c => c.Id)
                .ToListAsync();
        }

        public async Task<Categoria?> ObterPorIdAsync(int id)
        {
            return await _context.Categorias
                .FirstOrDefaultAsync(c => c.Id == id && c.Ativo);
        }

        public async Task<Categoria> AdicionarAsync(Categoria categoria)
        {
            await _context.Categorias.AddAsync(categoria);
            await _context.SaveChangesAsync();
            return categoria;
        }

        public async Task<Categoria> AtualizarAsync(Categoria categoria)
        {
            _context.Categorias.Update(categoria);
            await _context.SaveChangesAsync();
            return categoria;
        }

        public async Task ExcluirAsync(int id)
        {
            var categoria = await _context.Categorias.FindAsync(id);
            if (categoria != null)
            {
                categoria.Ativo = false;
                await _context.SaveChangesAsync();
            }
        }
    }
}
