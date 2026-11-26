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

        public async Task<IEnumerable<Mensagem>> ObterConversaAsync(int usuarioA, int usuarioB, int? antesId = null, int limite = 50)
        {
            var query = _context.Mensagens
                .AsNoTracking()
                .Where(m => m.Ativo && m.GrupoId == null &&
                    ((m.RemetenteId == usuarioA && m.DestinatarioId == usuarioB) ||
                     (m.RemetenteId == usuarioB && m.DestinatarioId == usuarioA)));

            if (antesId.HasValue)
                query = query.Where(m => m.Id < antesId.Value);

            return await query
                .Include(m => m.Remetente)
                .Include(m => m.Destinatario)
                .Include(m => m.MensagemRespondida!.Remetente)
                .OrderByDescending(m => m.DataCriacao)
                .Take(limite)
                .ToListAsync();
        }

        public async Task<Mensagem?> ObterPorIdAsync(int id)
        {
            return await _context.Mensagens
                .AsNoTracking()
                .Include(m => m.Remetente)
                .Include(m => m.Destinatario)
                .Include(m => m.MensagemRespondida!.Remetente)
                .FirstOrDefaultAsync(m => m.Id == id && m.Ativo);
        }

        public async Task<IEnumerable<Mensagem>> ObterConversasRecentesAsync(int usuarioId)
        {
            var todas = await _context.Mensagens
                .AsNoTracking()
                .Where(m => m.Ativo && m.GrupoId == null && (m.RemetenteId == usuarioId || m.DestinatarioId == usuarioId))
                .Include(m => m.Remetente)
                .Include(m => m.Destinatario)
                .OrderByDescending(m => m.DataCriacao)
                .Take(500)
                .ToListAsync();

            return todas;
        }

        public async Task<IEnumerable<Mensagem>> BuscarAsync(int usuarioId, string termo, int? contatoId = null, int limite = 50)
        {
            var t = termo.Trim();
            var query = _context.Mensagens
                .AsNoTracking()
                .Where(m => m.Ativo && m.GrupoId == null && (m.RemetenteId == usuarioId || m.DestinatarioId == usuarioId));

            if (contatoId.HasValue)
            {
                query = query.Where(m =>
                    (m.RemetenteId == contatoId.Value && m.DestinatarioId == usuarioId) ||
                    (m.DestinatarioId == contatoId.Value && m.RemetenteId == usuarioId));
            }

            query = query.Where(m =>
                m.Texto.Contains(t) ||
                (m.VinculoTitulo != null && m.VinculoTitulo.Contains(t)) ||
                (m.ImagemNome != null && m.ImagemNome.Contains(t)));

            return await query
                .Include(m => m.Remetente)
                .Include(m => m.Destinatario)
                .OrderByDescending(m => m.DataCriacao)
                .Take(limite)
                .ToListAsync();
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
                .Where(m => m.Ativo && m.GrupoId == null && !m.Lida && m.RemetenteId == remetenteId && m.DestinatarioId == destinatarioId)
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
            if (mensagem == null || (mensagem.DestinatarioId ?? 0) != destinatarioId)
                return null;

            if (!mensagem.Entregue)
            {
                mensagem.Entregue = true;
                await _context.SaveChangesAsync();
            }

            return mensagem.RemetenteId;
        }

        public async Task<GrupoChat> AdicionarGrupoAsync(GrupoChat grupo)
        {
            _context.GrupoChats.Add(grupo);
            await _context.SaveChangesAsync();
            return grupo;
        }

        public async Task AdicionarParticipantesAsync(IEnumerable<GrupoChatParticipante> participantes)
        {
            _context.GrupoChatParticipantes.AddRange(participantes);
            await _context.SaveChangesAsync();
        }

        public async Task<GrupoChat?> ObterGrupoAsync(int grupoId)
        {
            return await _context.GrupoChats
                .AsNoTracking()
                .Include(g => g.Participantes).ThenInclude(p => p.Usuario)
                .FirstOrDefaultAsync(g => g.Id == grupoId && g.Ativo);
        }

        public async Task<IEnumerable<GrupoChat>> ObterGruposDoUsuarioAsync(int usuarioId)
        {
            var grupos = await _context.GrupoChats
                .AsNoTracking()
                .Where(g => g.Ativo && g.Participantes.Any(p => p.Ativo && p.UsuarioId == usuarioId))
                .Include(g => g.Participantes).ThenInclude(p => p.Usuario)
                .ToListAsync();

            return grupos;
        }

        public async Task<bool> UsuarioEhParticipanteAsync(int grupoId, int usuarioId)
        {
            return await _context.GrupoChatParticipantes
                .AnyAsync(p => p.Ativo && p.GrupoId == grupoId && p.UsuarioId == usuarioId);
        }

        public async Task<IEnumerable<Mensagem>> ObterConversaGrupoAsync(int grupoId, int? antesId = null, int limite = 50)
        {
            var query = _context.Mensagens
                .AsNoTracking()
                .Where(m => m.Ativo && m.GrupoId == grupoId);

            if (antesId.HasValue)
                query = query.Where(m => m.Id < antesId.Value);

            return await query
                .Include(m => m.Remetente)
                .Include(m => m.MensagemRespondida!.Remetente)
                .OrderByDescending(m => m.DataCriacao)
                .Take(limite)
                .ToListAsync();
        }

        public async Task<int> ContarParticipantesGrupoAsync(int grupoId)
        {
            return await _context.GrupoChatParticipantes
                .CountAsync(p => p.Ativo && p.GrupoId == grupoId);
        }

        public async Task<Dictionary<int, int>> ObterContagemLeiturasGrupoAsync(int grupoId)
        {
            var contagem = await _context.MensagemLeituras
                .Where(l => l.Mensagem.GrupoId == grupoId && l.Mensagem.Ativo)
                .GroupBy(l => l.MensagemId)
                .Select(g => new { MensagemId = g.Key, Total = g.Count() })
                .ToDictionaryAsync(x => x.MensagemId, x => x.Total);

            return contagem;
        }

        public async Task<int> ContarNaoLidasGrupoAsync(int grupoId, int usuarioId)
        {
            return await _context.Mensagens.CountAsync(m =>
                m.Ativo && m.GrupoId == grupoId && m.RemetenteId != usuarioId &&
                !_context.MensagemLeituras.Any(l => l.MensagemId == m.Id && l.UsuarioId == usuarioId));
        }

        public async Task<Mensagem?> ObterUltimaMensagemGrupoAsync(int grupoId)
        {
            return await _context.Mensagens
                .AsNoTracking()
                .Where(m => m.Ativo && m.GrupoId == grupoId)
                .OrderByDescending(m => m.DataCriacao)
                .FirstOrDefaultAsync();
        }

        public async Task<List<int>> MarcarGrupoLidasAsync(int grupoId, int usuarioId)
        {
            var mensagens = await _context.Mensagens
                .Where(m => m.Ativo && m.GrupoId == grupoId && m.RemetenteId != usuarioId)
                .Select(m => m.Id)
                .ToListAsync();

            var jaLidas = await _context.MensagemLeituras
                .Where(l => l.UsuarioId == usuarioId &&
                            l.Mensagem.GrupoId == grupoId &&
                            l.Mensagem.Ativo &&
                            l.Mensagem.RemetenteId != usuarioId)
                .Select(l => l.MensagemId)
                .ToListAsync();

            var novas = mensagens.Where(id => !jaLidas.Contains(id)).ToList();

            foreach (var id in novas)
            {
                _context.MensagemLeituras.Add(new MensagemLeitura
                {
                    MensagemId = id,
                    UsuarioId = usuarioId,
                });
            }

            await _context.SaveChangesAsync();
            return novas;
        }

        public async Task<Mensagem> AdicionarMensagemGrupoAsync(Mensagem mensagem, int grupoId)
        {
            mensagem.GrupoId = grupoId;
            _context.Mensagens.Add(mensagem);
            await _context.SaveChangesAsync();

            _context.MensagemLeituras.Add(new MensagemLeitura
            {
                MensagemId = mensagem.Id,
                UsuarioId = mensagem.RemetenteId,
            });
            await _context.SaveChangesAsync();

            return mensagem;
        }

        public async Task<bool> RemoverParticipanteAsync(int grupoId, int usuarioId)
        {
            var participante = await _context.GrupoChatParticipantes
                .FirstOrDefaultAsync(p => p.GrupoId == grupoId && p.UsuarioId == usuarioId && p.Ativo);

            if (participante == null)
                return false;

            participante.Ativo = false;

            var leituras = await _context.MensagemLeituras
                .Where(l => l.UsuarioId == usuarioId && l.Mensagem.GrupoId == grupoId && l.Mensagem.Ativo)
                .ToListAsync();

            if (leituras.Count > 0)
                _context.MensagemLeituras.RemoveRange(leituras);

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> AdicionarParticipanteAsync(int grupoId, int usuarioId)
        {
            var existente = await _context.GrupoChatParticipantes
                .FirstOrDefaultAsync(p => p.GrupoId == grupoId && p.UsuarioId == usuarioId);

            if (existente != null)
            {
                if (existente.Ativo)
                    return false;

                existente.Ativo = true;
                await _context.SaveChangesAsync();
                return true;
            }

            _context.GrupoChatParticipantes.Add(new GrupoChatParticipante
            {
                GrupoId = grupoId,
                UsuarioId = usuarioId,
            });
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
