using Microsoft.EntityFrameworkCore;
using TesisFlow.Contexto.Contextos;
using TesisFlow.Core.Interfaces;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Servicos.Mensagens
{
    public class MensagemRepositorio : IMensagemRepositorio
    {
        private readonly ApplicationDbContextTesisFlow _context;

        public MensagemRepositorio(ApplicationDbContextTesisFlow context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Mensagem>> ObterConversaAsync(int usuarioA, int usuarioB, int limite = 50)
        {
            return await _context.Mensagens
                .AsNoTracking()
                .Where(m => m.Ativo &&
                    ((m.RemetenteId == usuarioA && m.DestinatarioId == usuarioB) ||
                     (m.RemetenteId == usuarioB && m.DestinatarioId == usuarioA)))
                .OrderByDescending(m => m.DataCriacao)
                .Take(limite)
                .ToListAsync();
        }

        public async Task<IEnumerable<Mensagem>> ObterConversasRecentesAsync(int usuarioId)
        {
            var todas = await _context.Mensagens
                .AsNoTracking()
                .Where(m => m.Ativo && (m.RemetenteId == usuarioId || m.DestinatarioId == usuarioId))
                .Include(m => m.Remetente)
                .Include(m => m.Destinatario)
                .OrderByDescending(m => m.DataCriacao)
                .Take(500)
                .ToListAsync();

            return todas;
        }

        public async Task<Mensagem> AdicionarAsync(Mensagem mensagem)
        {
            _context.Mensagens.Add(mensagem);
            await _context.SaveChangesAsync();
            return mensagem;
        }

        public async Task<List<int>> MarcarComoLidasAsync(int remetenteId, int destinatarioId)
        {
            var mensagens = await _context.Mensagens
                .Where(m => m.Ativo && !m.Lida && m.RemetenteId == remetenteId && m.DestinatarioId == destinatarioId)
                .ToListAsync();

            var ids = mensagens.Select(m => m.Id).ToList();

            foreach (var m in mensagens)
                m.Lida = true;

            await _context.SaveChangesAsync();
            return ids;
        }

        public async Task<int?> MarcarEntregueAsync(int mensagemId, int destinatarioId)
        {
            var mensagem = await _context.Mensagens.FindAsync(mensagemId);
            if (mensagem == null || mensagem.DestinatarioId != destinatarioId)
                return null;

            if (!mensagem.Entregue)
            {
                mensagem.Entregue = true;
                await _context.SaveChangesAsync();
            }

            return mensagem.RemetenteId;
        }
    }
}
