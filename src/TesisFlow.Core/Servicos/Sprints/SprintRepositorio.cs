using Microsoft.EntityFrameworkCore;
using TesisFlow.Contexto.Contextos;
using TesisFlow.Core.Interfaces;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Servicos.Sprints
{
    public class SprintRepositorio : ISprintRepositorio
    {
        private readonly ApplicationDbContextTesisFlow _context;

        public SprintRepositorio(ApplicationDbContextTesisFlow context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Sprint>> ObterTodosAsync()
        {
            return await _context.Sprints
                .Include(s => s.Projeto)
                .Include(s => s.Tarefas)
                .Where(s => s.Ativo)
                .ToListAsync();
        }

        public async Task<Sprint?> ObterPorIdAsync(int id)
        {
            return await _context.Sprints
                .Include(s => s.Projeto)
                .Include(s => s.Tarefas)
                .FirstOrDefaultAsync(s => s.Id == id && s.Ativo);
        }

        public async Task<IEnumerable<Sprint>> ObterPorProjetoAsync(int projetoId)
        {
            return await _context.Sprints
                .Include(s => s.Tarefas)
                .Where(s => s.ProjetoId == projetoId && s.Ativo)
                .OrderByDescending(s => s.DataInicio)
                .ToListAsync();
        }

        public async Task<Sprint> AdicionarAsync(Sprint sprint)
        {
            await _context.Sprints.AddAsync(sprint);
            await _context.SaveChangesAsync();
            return sprint;
        }

        public async Task<Sprint> AtualizarAsync(Sprint sprint)
        {
            _context.Sprints.Update(sprint);
            await _context.SaveChangesAsync();
            return sprint;
        }

        public async Task ExcluirAsync(int id)
        {
            var sprint = await _context.Sprints.FindAsync(id);
            if (sprint != null)
            {
                sprint.Ativo = false;
                await _context.SaveChangesAsync();
            }
        }
    }
}
