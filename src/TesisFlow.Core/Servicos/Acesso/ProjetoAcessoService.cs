using Microsoft.EntityFrameworkCore;
using TesisFlow.Contexto.Contextos;
using TesisFlow.Modelo.Enums;

namespace TesisFlow.Core.Servicos.Acesso
{
    public class ProjetoAcessoService
    {
        private readonly ApplicationDbContextTesisFlow _context;

        public ProjetoAcessoService(ApplicationDbContextTesisFlow context)
        {
            _context = context;
        }

        public Task<bool> PodeAcessarProjetoAsync(int projetoId, int usuarioId)
        {
            return _context.Projetos.AnyAsync(p => p.Id == projetoId
                && (p.LiderId == usuarioId
                    || _context.ProjetoMembros.Any(pm => pm.ProjetoId == projetoId
                        && pm.UsuarioId == usuarioId && pm.Ativo && pm.Status == StatusConvite.Aceito)));
        }

        public async Task<bool> PodeAcessarTarefaAsync(int tarefaId, int usuarioId)
        {
            var projetoId = await _context.Tarefas
                .Where(t => t.Id == tarefaId)
                .Select(t => t.ProjetoId)
                .FirstOrDefaultAsync();

            if (projetoId == 0) return false;
            return await PodeAcessarProjetoAsync(projetoId, usuarioId);
        }
    }
}
