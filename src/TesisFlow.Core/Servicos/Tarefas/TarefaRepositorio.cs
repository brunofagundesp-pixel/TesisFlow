using Microsoft.EntityFrameworkCore;
using TesisFlow.Contexto.Contextos;
using TesisFlow.Core.Interfaces;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Servicos.Tarefas
{
    public class TarefaRepositorio : ITarefaRepositorio
    {
        private readonly ApplicationDbContextTesisFlow _context;

        public TarefaRepositorio(ApplicationDbContextTesisFlow context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Tarefa>> ObterTodosAsync()
        {
            return await _context.Tarefas
                .AsNoTracking()
                .AsSplitQuery()
                .Include(t => t.Projeto)
                .Include(t => t.TarefaResponsaveis).ThenInclude(tr => tr.Usuario)
                .Include(t => t.Criador)
                .Include(t => t.Sprint)
                .Where(t => t.Ativo)
                .OrderBy(t => t.Ordem)
                .ToListAsync();
        }

        public async Task<Tarefa?> ObterPorChaveAsync(string chave)
        {
            return await _context.Tarefas
                .AsNoTracking()
                .AsSplitQuery()
                .Include(t => t.Projeto)
                .Include(t => t.TarefaResponsaveis).ThenInclude(tr => tr.Usuario)
                .Include(t => t.Criador)
                .Include(t => t.Sprint)
                .FirstOrDefaultAsync(t => t.Chave == chave && t.Ativo);
        }

        public async Task<Tarefa?> ObterPorIdAsync(int id)
        {
            return await _context.Tarefas
                .AsNoTracking()
                .AsSplitQuery()
                .Include(t => t.Projeto)
                .Include(t => t.TarefaResponsaveis).ThenInclude(tr => tr.Usuario)
                .Include(t => t.Criador)
                .Include(t => t.Sprint)
                .Include(t => t.Comentarios).ThenInclude(c => c.Usuario)
                .FirstOrDefaultAsync(t => t.Id == id && t.Ativo);
        }

        public async Task<IEnumerable<Tarefa>> ObterPorProjetoAsync(int projetoId)
        {
            return await _context.Tarefas
                .AsNoTracking()
                .AsSplitQuery()
                .Include(t => t.Projeto)
                .Include(t => t.TarefaResponsaveis).ThenInclude(tr => tr.Usuario)
                .Include(t => t.Criador)
                .Include(t => t.Sprint)
                .Where(t => t.ProjetoId == projetoId && t.Ativo)
                .OrderBy(t => t.Ordem)
                .ToListAsync();
        }

        public async Task<IEnumerable<Tarefa>> ObterPorSprintAsync(int sprintId)
        {
            return await _context.Tarefas
                .AsNoTracking()
                .AsSplitQuery()
                .Include(t => t.Projeto)
                .Include(t => t.TarefaResponsaveis).ThenInclude(tr => tr.Usuario)
                .Where(t => t.SprintId == sprintId && t.Ativo)
                .OrderBy(t => t.Ordem)
                .ToListAsync();
        }

        public async Task<IEnumerable<Tarefa>> ObterPorResponsavelAsync(int usuarioId)
        {
            return await _context.Tarefas
                .AsNoTracking()
                .AsSplitQuery()
                .Include(t => t.Projeto)
                .Include(t => t.TarefaResponsaveis).ThenInclude(tr => tr.Usuario)
                .Include(t => t.Criador)
                .Where(t => t.Ativo && t.TarefaResponsaveis.Any(tr => tr.UsuarioId == usuarioId))
                .OrderBy(t => t.Ordem)
                .ToListAsync();
        }

        public async Task<int> ObterMaiorOrdemAsync(int projetoId, Modelo.Enums.StatusTarefa status)
        {
            return await _context.Tarefas
                .Where(t => t.ProjetoId == projetoId && t.Status == status && t.Ativo)
                .MaxAsync(t => (int?)t.Ordem) ?? 0;
        }

        public async Task<IEnumerable<Tarefa>> BuscarAsync(string termo, int usuarioId)
        {
            return await _context.Tarefas
                .AsNoTracking()
                .Include(t => t.Projeto)
                .Include(t => t.TarefaResponsaveis).ThenInclude(tr => tr.Usuario)
                .Include(t => t.Criador)
                .Where(t => t.Ativo
                    && (_context.ProjetoMembros.Any(pm => pm.ProjetoId == t.ProjetoId && pm.UsuarioId == usuarioId && pm.Ativo)
                        || t.Projeto.LiderId == usuarioId)
                    && (t.Titulo.Contains(termo) || t.Chave != null && t.Chave.Contains(termo) || (t.Descricao != null && t.Descricao.Contains(termo))))
                .OrderByDescending(t => t.DataCriacao)
                .Take(10)
                .ToListAsync();
        }

        public async Task<Tarefa> AdicionarAsync(Tarefa tarefa)
        {
            await _context.Tarefas.AddAsync(tarefa);
            await _context.SaveChangesAsync();
            return tarefa;
        }

        public async Task<Tarefa> AtualizarAsync(Tarefa tarefa)
        {
            _context.Tarefas.Update(tarefa);
            await _context.SaveChangesAsync();
            return tarefa;
        }

        public async Task ExcluirAsync(int id)
        {
            var tarefa = await _context.Tarefas.FindAsync(id);
            if (tarefa != null)
            {
                tarefa.Ativo = false;
                await _context.SaveChangesAsync();
            }
        }

        public async Task MoverAsync(int id, int ordem, int status)
        {
            var tarefa = await _context.Tarefas.FindAsync(id);
            if (tarefa != null)
            {
                tarefa.Ordem = ordem;
                tarefa.Status = (Modelo.Enums.StatusTarefa)status;
                if (status == (int)Modelo.Enums.StatusTarefa.Feito)
                    tarefa.DataConclusao = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }
    }
}
