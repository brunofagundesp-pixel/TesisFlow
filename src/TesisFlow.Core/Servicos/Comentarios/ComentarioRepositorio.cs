using Microsoft.EntityFrameworkCore;
using TesisFlow.Contexto.Contextos;
using TesisFlow.Core.Interfaces;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Servicos.Comentarios
{
    public class ComentarioRepositorio : IComentarioRepositorio
    {
        private readonly ApplicationDbContextTesisFlow _context;

        public ComentarioRepositorio(ApplicationDbContextTesisFlow context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Comentario>> ObterPorTarefaAsync(int tarefaId)
        {
            return await _context.Comentarios
                .Include(c => c.Usuario)
                .Where(c => c.TarefaId == tarefaId && c.Ativo)
                .OrderByDescending(c => c.DataCriacao)
                .ToListAsync();
        }

        public async Task<Comentario?> ObterPorIdAsync(int id)
        {
            return await _context.Comentarios
                .Include(c => c.Usuario)
                .FirstOrDefaultAsync(c => c.Id == id && c.Ativo);
        }

        public async Task<Comentario> AdicionarAsync(Comentario comentario)
        {
            await _context.Comentarios.AddAsync(comentario);
            await _context.SaveChangesAsync();
            return comentario;
        }

        public async Task<Comentario> AtualizarAsync(Comentario comentario)
        {
            _context.Comentarios.Update(comentario);
            await _context.SaveChangesAsync();
            return comentario;
        }

        public async Task CurtirAsync(int id)
        {
            var comentario = await _context.Comentarios.FindAsync(id);
            if (comentario != null)
            {
                comentario.Curtidas++;
                await _context.SaveChangesAsync();
            }
        }

        public async Task DescurtirAsync(int id)
        {
            var comentario = await _context.Comentarios.FindAsync(id);
            if (comentario != null && comentario.Curtidas > 0)
            {
                comentario.Curtidas--;
                await _context.SaveChangesAsync();
            }
        }

        public async Task ExcluirAsync(int id)
        {
            var comentario = await _context.Comentarios.FindAsync(id);
            if (comentario != null)
            {
                comentario.Ativo = false;
                await _context.SaveChangesAsync();
            }
        }
    }
}
