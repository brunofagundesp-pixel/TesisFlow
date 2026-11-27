using System.Linq.Expressions;
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
                .Include(t => t.Categoria)
                .Include(t => t.TarefaResponsaveis).ThenInclude(tr => tr.Usuario)
                .Include(t => t.Criador)
                .Include(t => t.Sprint)
                .Where(t => t.Ativo)
                .OrderBy(t => t.Ordem)
                .ToListAsync();
        }

        private Expression<Func<Tarefa, bool>> PodeVer(int usuarioId) =>
            t => t.Projeto.LiderId == usuarioId ||
                 _context.ProjetoMembros.Any(pm => pm.ProjetoId == t.ProjetoId
                     && pm.UsuarioId == usuarioId && pm.Ativo && pm.Status == Modelo.Enums.StatusConvite.Aceito);

        public async Task<Tarefa?> ObterPorChaveAsync(string chave, int usuarioId)
        {
            return await _context.Tarefas
                .AsNoTracking()
                .AsSplitQuery()
                .Include(t => t.Projeto)
                .Include(t => t.Categoria)
                .Include(t => t.TarefaResponsaveis).ThenInclude(tr => tr.Usuario)
                .Include(t => t.Criador)
                .Include(t => t.Sprint)
                .Where(t => t.Chave == chave && t.Ativo)
                .Where(PodeVer(usuarioId))
                .FirstOrDefaultAsync();
        }

        public async Task<Tarefa?> ObterPorIdAsync(int id)
        {
            return await _context.Tarefas
                .AsNoTracking()
                .AsSplitQuery()
                .Include(t => t.Projeto)
                .Include(t => t.Categoria)
                .Include(t => t.TarefaResponsaveis).ThenInclude(tr => tr.Usuario)
                .Include(t => t.Criador)
                .Include(t => t.Sprint)
                .Include(t => t.Comentarios).ThenInclude(c => c.Usuario)
                .FirstOrDefaultAsync(t => t.Id == id && t.Ativo);
        }

        public async Task<Tarefa?> ObterPorIdComAcessoAsync(int id, int usuarioId)
        {
            return await _context.Tarefas
                .AsNoTracking()
                .AsSplitQuery()
                .Include(t => t.Projeto)
                .Include(t => t.Categoria)
                .Include(t => t.TarefaResponsaveis).ThenInclude(tr => tr.Usuario)
                .Include(t => t.Criador)
                .Include(t => t.Sprint)
                .Include(t => t.Comentarios).ThenInclude(c => c.Usuario)
                .Where(t => t.Id == id && t.Ativo)
                .Where(PodeVer(usuarioId))
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<Tarefa>> ObterPorProjetoAsync(int projetoId, int usuarioId)
        {
            return await _context.Tarefas
                .AsNoTracking()
                .AsSplitQuery()
                .Include(t => t.Projeto)
                .Include(t => t.Categoria)
                .Include(t => t.TarefaResponsaveis).ThenInclude(tr => tr.Usuario)
                .Include(t => t.Criador)
                .Include(t => t.Sprint)
                .Where(t => t.ProjetoId == projetoId && t.Ativo)
                .Where(PodeVer(usuarioId))
                .OrderBy(t => t.Ordem)
                .ToListAsync();
        }

        public async Task<IEnumerable<Tarefa>> ObterPorSprintAsync(int sprintId, int usuarioId)
        {
            return await _context.Tarefas
                .AsNoTracking()
                .AsSplitQuery()
                .Include(t => t.Projeto)
                .Include(t => t.Categoria)
                .Include(t => t.TarefaResponsaveis).ThenInclude(tr => tr.Usuario)
                .Where(t => t.SprintId == sprintId && t.Ativo)
                .Where(PodeVer(usuarioId))
                .OrderBy(t => t.Ordem)
                .ToListAsync();
        }

        public async Task<IEnumerable<Tarefa>> ObterPorResponsavelAsync(int usuarioId)
        {
            return await _context.Tarefas
                .AsNoTracking()
                .AsSplitQuery()
                .Include(t => t.Projeto)
                .Include(t => t.Categoria)
                .Include(t => t.TarefaResponsaveis).ThenInclude(tr => tr.Usuario)
                .Include(t => t.Criador)
                .Where(t => t.Ativo && t.TarefaResponsaveis.Any(tr => tr.UsuarioId == usuarioId))
                .OrderBy(t => t.Ordem)
                .ToListAsync();
        }

        public async Task<IEnumerable<Tarefa>> ObterPorMeuDiaAsync(int usuarioId)
        {
            var hoje = DateTime.Today;
            return await _context.Tarefas
                .AsNoTracking()
                .AsSplitQuery()
                .Include(t => t.Projeto)
                .Include(t => t.Categoria)
                .Include(t => t.TarefaResponsaveis).ThenInclude(tr => tr.Usuario)
                .Include(t => t.Criador)
                .Include(t => t.Sprint)
                .Where(t => t.Ativo && _context.TarefasMeuDia.Any(td => td.TarefaId == t.Id && td.UsuarioId == usuarioId && td.Ativo && td.Data == hoje))
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
                .Include(t => t.Categoria)
                .Include(t => t.TarefaResponsaveis).ThenInclude(tr => tr.Usuario)
                .Include(t => t.Criador)
                .Where(t => t.Ativo
                    && (t.Titulo.Contains(termo) || t.Chave != null && t.Chave.Contains(termo) || (t.Descricao != null && t.Descricao.Contains(termo))))
                .Where(PodeVer(usuarioId))
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
                tarefa.DataExclusao = DateTime.UtcNow;
                tarefa.ContatoId = null;
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

        public async Task ReordenarAsync(IEnumerable<(int Id, int Ordem, int Status)> itens)
        {
            var lista = itens.ToList();
            if (lista.Count == 0) return;

            foreach (var item in lista)
            {
                var tarefa = await _context.Tarefas.FindAsync(item.Id);
                if (tarefa == null) continue;

                tarefa.Ordem = item.Ordem;
                tarefa.Status = (Modelo.Enums.StatusTarefa)item.Status;
                if (item.Status == (int)Modelo.Enums.StatusTarefa.Feito && tarefa.DataConclusao == null)
                    tarefa.DataConclusao = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
        }

        public async Task<Tarefa?> ObterPorIdIncluindoExcluidosAsync(int id)
        {
            return await _context.Tarefas
                .AsNoTracking()
                .AsSplitQuery()
                .Include(t => t.Projeto)
                .Include(t => t.Categoria)
                .Include(t => t.TarefaResponsaveis).ThenInclude(tr => tr.Usuario)
                .Include(t => t.Criador)
                .Include(t => t.Sprint)
                .FirstOrDefaultAsync(t => t.Id == id);
        }

        public async Task<IEnumerable<Tarefa>> ListarLixeiraAsync(int usuarioId)
        {
            return await _context.Tarefas
                .AsNoTracking()
                .AsSplitQuery()
                .Include(t => t.Projeto)
                .Include(t => t.Categoria)
                .Include(t => t.TarefaResponsaveis).ThenInclude(tr => tr.Usuario)
                .Include(t => t.Criador)
                .Include(t => t.Sprint)
                .Where(t => !t.Ativo)
                .Where(PodeVer(usuarioId))
                .OrderByDescending(t => t.DataExclusao)
                .ToListAsync();
        }

        public async Task RestaurarAsync(int id)
        {
            var tarefa = await _context.Tarefas.FindAsync(id);
            if (tarefa != null)
            {
                tarefa.Ativo = true;
                tarefa.DataExclusao = null;
                await _context.SaveChangesAsync();
            }
        }

        public async Task ExcluirDefinitivamenteAsync(int id)
        {
            var tarefa = await _context.Tarefas.FindAsync(id);
            if (tarefa == null) return;

            var comentarioIds = await _context.Comentarios
                .Where(c => c.TarefaId == id)
                .Select(c => c.Id)
                .ToListAsync();

            if (comentarioIds.Count > 0)
            {
                var reacoes = _context.ComentarioReacoes.Where(r => _context.Comentarios.Any(c => c.Id == r.ComentarioId && c.TarefaId == id));
                _context.ComentarioReacoes.RemoveRange(reacoes);

                var comentarios = _context.Comentarios.Where(c => c.TarefaId == id);
                _context.Comentarios.RemoveRange(comentarios);
            }

            var anexos = _context.Anexos.Where(a => a.TarefaId == id);
            _context.Anexos.RemoveRange(anexos);

            var historicos = _context.HistoricoTarefas.Where(h => h.TarefaId == id);
            _context.HistoricoTarefas.RemoveRange(historicos);

            var responsaveis = _context.TarefaResponsaveis.Where(tr => tr.TarefaId == id);
            _context.TarefaResponsaveis.RemoveRange(responsaveis);

            var meuDia = _context.TarefasMeuDia.Where(td => td.TarefaId == id);
            _context.TarefasMeuDia.RemoveRange(meuDia);

            _context.Tarefas.Remove(tarefa);
            await _context.SaveChangesAsync();
        }

        public async Task<int> LimparLixeiraAsync(DateTime limite)
        {
            var ids = await _context.Tarefas
                .Where(t => !t.Ativo && t.DataExclusao != null && t.DataExclusao < limite)
                .Select(t => t.Id)
                .ToListAsync();

            foreach (var id in ids)
            {
                await ExcluirDefinitivamenteAsync(id);
            }

            return ids.Count;
        }
    }
}
