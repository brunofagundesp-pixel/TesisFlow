using Microsoft.EntityFrameworkCore;
using TesisFlow.Contexto.Contextos;
using TesisFlow.Core.Interfaces;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Servicos.Notificacoes
{
    public class NotificacaoRepositorio : INotificacaoRepositorio
    {
        private readonly ApplicationDbContextTesisFlow _context;

        public NotificacaoRepositorio(ApplicationDbContextTesisFlow context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Notificacao>> ObterPorUsuarioAsync(int usuarioId)
        {
            return await _context.Notificacoes
                .AsNoTracking()
                .Where(n => n.Ativo && (n.TargetUserId == null || n.TargetUserId == usuarioId))
                .OrderByDescending(n => n.DataCriacao)
                .Take(100)
                .ToListAsync();
        }

        public async Task<Notificacao> AdicionarAsync(Notificacao notificacao)
        {
            _context.Notificacoes.Add(notificacao);
            await _context.SaveChangesAsync();
            return notificacao;
        }

        public async Task MarcarComoLidaAsync(int id)
        {
            var notificacao = await _context.Notificacoes.FindAsync(id);
            if (notificacao != null)
            {
                notificacao.Lida = true;
                await _context.SaveChangesAsync();
            }
        }

        public async Task MarcarTodasComoLidasAsync(int usuarioId)
        {
            var notificacoes = await _context.Notificacoes
                .Where(n => n.Ativo && !n.Lida && (n.TargetUserId == null || n.TargetUserId == usuarioId))
                .ToListAsync();

            foreach (var n in notificacoes)
            {
                n.Lida = true;
            }

            await _context.SaveChangesAsync();
        }
    }
}
