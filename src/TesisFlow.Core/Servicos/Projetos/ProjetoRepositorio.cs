using Microsoft.EntityFrameworkCore;
using TesisFlow.Contexto.Contextos;
using TesisFlow.Core.Interfaces;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Servicos.Projetos
{
    public class ProjetoRepositorio : IProjetoRepositorio
    {
        private readonly ApplicationDbContextTesisFlow _context;

        public ProjetoRepositorio(ApplicationDbContextTesisFlow context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Projeto>> ObterTodosAsync()
        {
            return await _context.Projetos
                .AsNoTracking()
                .Include(p => p.Lider)
                .Include(p => p.Membros).ThenInclude(m => m.Usuario)
                .Where(p => p.Ativo)
                .ToListAsync();
        }

        public async Task<Dictionary<int, int>> ObterQuantidadeTarefasAsync()
        {
            return await _context.Tarefas
                .Where(t => t.Ativo)
                .GroupBy(t => t.ProjetoId)
                .Select(g => new { ProjetoId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.ProjetoId, x => x.Count);
        }

        public async Task AdicionarMembroAsync(int projetoId, int usuarioId)
        {
            var existente = await _context.ProjetoMembros
                .FirstOrDefaultAsync(pm => pm.ProjetoId == projetoId && pm.UsuarioId == usuarioId);

            if (existente == null)
            {
                var membro = new ProjetoMembro
                {
                    ProjetoId = projetoId,
                    UsuarioId = usuarioId,
                    Papel = Modelo.Enums.PapelProjeto.Membro,
                    Status = Modelo.Enums.StatusConvite.Pendente
                };
                await _context.ProjetoMembros.AddAsync(membro);
                await _context.SaveChangesAsync();
            }
            else if (existente.Status == Modelo.Enums.StatusConvite.Recusado)
            {
                existente.Status = Modelo.Enums.StatusConvite.Pendente;
                await _context.SaveChangesAsync();
            }
        }

        public async Task AceitarConviteAsync(int projetoId, int usuarioId)
        {
            var membro = await _context.ProjetoMembros
                .FirstOrDefaultAsync(pm => pm.ProjetoId == projetoId && pm.UsuarioId == usuarioId);

            if (membro != null)
            {
                membro.Status = Modelo.Enums.StatusConvite.Aceito;
                await _context.SaveChangesAsync();
            }
        }

        public async Task RecusarConviteAsync(int projetoId, int usuarioId)
        {
            var membro = await _context.ProjetoMembros
                .FirstOrDefaultAsync(pm => pm.ProjetoId == projetoId && pm.UsuarioId == usuarioId);

            if (membro != null)
            {
                membro.Status = Modelo.Enums.StatusConvite.Recusado;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<Projeto?> ObterPorIdAsync(int id)
        {
            return await _context.Projetos
                .Include(p => p.Lider)
                .Include(p => p.Membros).ThenInclude(m => m.Usuario)
                .FirstOrDefaultAsync(p => p.Id == id && p.Ativo);
        }

        public async Task<IEnumerable<Projeto>> ObterPorUsuarioAsync(int usuarioId)
        {
            return await _context.ProjetoMembros
                .Where(pm => pm.UsuarioId == usuarioId && pm.Ativo)
                .Select(pm => pm.Projeto)
                .Include(p => p.Lider)
                .Where(p => p.Ativo)
                .ToListAsync();
        }

        public async Task<Projeto> AdicionarAsync(Projeto projeto)
        {
            await _context.Projetos.AddAsync(projeto);
            await _context.SaveChangesAsync();
            return projeto;
        }

        public async Task<Projeto> AtualizarAsync(Projeto projeto)
        {
            _context.Projetos.Update(projeto);
            await _context.SaveChangesAsync();
            return projeto;
        }

        public async Task ExcluirAsync(int id)
        {
            var projeto = await _context.Projetos.FindAsync(id);
            if (projeto != null)
            {
                projeto.Ativo = false;
                await _context.SaveChangesAsync();
            }
        }
    }
}
