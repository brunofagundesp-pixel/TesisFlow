using Microsoft.EntityFrameworkCore;
using TesisFlow.Contexto.Contextos;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Contexto.Repositorios
{
    public class RepositorioBase<T> where T : EntidadeBase
    {
        protected readonly ApplicationDbContextTesisFlow _context;
        protected readonly DbSet<T> _dbSet;

        public RepositorioBase(ApplicationDbContextTesisFlow context)
        {
            _context = context;
            _dbSet = context.Set<T>();
        }

        public async Task<IEnumerable<T>> ObterTodosAsync()
        {
            return await _dbSet.Where(e => e.Ativo).ToListAsync();
        }

        public async Task<T?> ObterPorIdAsync(int id)
        {
            return await _dbSet.FirstOrDefaultAsync(e => e.Id == id && e.Ativo);
        }

        public async Task<T> AdicionarAsync(T entidade)
        {
            await _dbSet.AddAsync(entidade);
            await _context.SaveChangesAsync();
            return entidade;
        }

        public async Task<T> AtualizarAsync(T entidade)
        {
            _dbSet.Update(entidade);
            await _context.SaveChangesAsync();
            return entidade;
        }

        public async Task ExcluirAsync(int id)
        {
            var entidade = await _dbSet.FindAsync(id);
            if (entidade != null)
            {
                entidade.Ativo = false;
                await _context.SaveChangesAsync();
            }
        }

        public async Task ExcluirPermanentementeAsync(int id)
        {
            var entidade = await _dbSet.FindAsync(id);
            if (entidade != null)
            {
                _dbSet.Remove(entidade);
                await _context.SaveChangesAsync();
            }
        }

        public IQueryable<T> Query()
        {
            return _dbSet.Where(e => e.Ativo);
        }
    }
}
