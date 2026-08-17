using Microsoft.EntityFrameworkCore;
using TesisFlow.Contexto.Contextos;
using TesisFlow.Core.Interfaces;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Servicos.Tarefas
{
    public class TarefaMeuDiaRepositorio : ITarefaMeuDiaRepositorio
    {
        private readonly ApplicationDbContextTesisFlow _context;

        public TarefaMeuDiaRepositorio(ApplicationDbContextTesisFlow context)
        {
            _context = context;
        }

        public async Task<IEnumerable<int>> ObterIdsAsync(int usuarioId)
        {
            var hoje = DateTime.Today;
            return await _context.TarefasMeuDia
                .Where(td => td.UsuarioId == usuarioId && td.Ativo && td.Data == hoje)
                .Select(td => td.TarefaId)
                .ToListAsync();
        }

        public async Task<bool> AlternarAsync(int tarefaId, int usuarioId)
        {
            var hoje = DateTime.Today;
            var registro = await _context.TarefasMeuDia
                .FirstOrDefaultAsync(td => td.TarefaId == tarefaId && td.UsuarioId == usuarioId);

            if (registro != null)
            {
                var ativo = registro.Ativo && registro.Data == hoje;
                if (ativo)
                {
                    registro.Ativo = false;
                    await _context.SaveChangesAsync();
                    return false;
                }

                registro.Data = hoje;
                registro.Ativo = true;
                await _context.SaveChangesAsync();
                return true;
            }

            _context.TarefasMeuDia.Add(new TarefaMeuDia
            {
                TarefaId = tarefaId,
                UsuarioId = usuarioId,
                Data = hoje
            });
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
