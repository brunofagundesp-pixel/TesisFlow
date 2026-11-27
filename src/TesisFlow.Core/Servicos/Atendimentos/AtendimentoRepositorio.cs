using Microsoft.EntityFrameworkCore;
using TesisFlow.Contexto.Contextos;
using TesisFlow.Core.Interfaces;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Servicos.Atendimentos
{
    public class AtendimentoRepositorio : IAtendimentoRepositorio
    {
        private readonly ApplicationDbContextTesisFlow _context;

        public AtendimentoRepositorio(ApplicationDbContextTesisFlow context)
        {
            _context = context;
        }

        public async Task<(IEnumerable<Atendimento> Itens, int Total)> ObterAsync(int? colegioId, int? status, string? busca, int top, int skip)
        {
            var query = _context.Atendimentos
                .AsNoTracking()
                .Include(a => a.Usuario)
                .Where(a => a.Ativo);

            if (colegioId.HasValue)
                query = query.Where(a => a.ColegioId == colegioId.Value);

            if (status.HasValue)
                query = query.Where(a => a.Status == status.Value);

            if (!string.IsNullOrWhiteSpace(busca))
            {
                var t = busca.Trim();
                query = query.Where(a =>
                    a.Titulo.Contains(t) ||
                    a.Descricao.Contains(t) ||
                    a.ColegioNome.Contains(t) ||
                    (a.NomeContato != null && a.NomeContato.Contains(t)));
            }

            var total = await query.CountAsync();

            var itens = await query
                .OrderByDescending(a => a.Id)
                .Skip(skip)
                .Take(top)
                .ToListAsync();

            return (itens, total);
        }

        public async Task<Atendimento?> ObterPorIdAsync(int id)
        {
            return await _context.Atendimentos
                .AsNoTracking()
                .Include(a => a.Usuario)
                .FirstOrDefaultAsync(a => a.Id == id && a.Ativo);
        }

        public async Task<IEnumerable<Atendimento>> ObterRetornosPendentesAsync(int? usuarioId = null)
        {
            var query = _context.Atendimentos
                .AsNoTracking()
                .Include(a => a.Usuario)
                .Where(a => a.Ativo && !a.RetornoConcluido && a.ProximoContatoData != null);

            if (usuarioId.HasValue)
                query = query.Where(a => a.UsuarioId == usuarioId.Value);

            return await query
                .OrderBy(a => a.ProximoContatoData)
                .ToListAsync();
        }

        public async Task<DateTime?> ObterUltimoContatoAsync(int colegioId)
        {
            return await _context.Atendimentos
                .Where(a => a.Ativo && a.ColegioId == colegioId)
                .MaxAsync(a => (DateTime?)a.DataCriacao);
        }

        public async Task<DateTime?> ObterProximoContatoPendenteAsync(int colegioId)
        {
            return await _context.Atendimentos
                .Where(a => a.Ativo && !a.RetornoConcluido && a.ProximoContatoData != null && a.ColegioId == colegioId)
                .MinAsync(a => a.ProximoContatoData);
        }

        public async Task<int> ContarRetornosAtrasadosAsync()
        {
            var agora = DateTime.UtcNow;

            return await _context.Atendimentos.CountAsync(a =>
                a.Ativo && !a.RetornoConcluido && a.ProximoContatoData != null && a.ProximoContatoData < agora);
        }

        public async Task<Atendimento> AdicionarAsync(Atendimento atendimento)
        {
            _context.Atendimentos.Add(atendimento);
            await _context.SaveChangesAsync();
            atendimento.Usuario = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Id == atendimento.UsuarioId);
            return atendimento;
        }

        public async Task<Atendimento> AtualizarAsync(Atendimento atendimento)
        {
            var existente = await _context.Atendimentos.FindAsync(atendimento.Id);
            if (existente == null || !existente.Ativo)
                throw new KeyNotFoundException();

            await _context.Entry(existente).Reference(a => a.Usuario).LoadAsync();

            existente.ColegioId = atendimento.ColegioId;
            existente.ColegioNome = atendimento.ColegioNome;
            existente.Titulo = atendimento.Titulo;
            existente.Descricao = atendimento.Descricao;
            existente.Status = atendimento.Status;
            existente.NomeContato = atendimento.NomeContato;
            existente.TipoInteracao = atendimento.TipoInteracao;
            existente.Canal = atendimento.Canal;
            existente.Resultado = atendimento.Resultado;
            existente.ContatoId = atendimento.ContatoId;
            existente.ProximoContatoMotivo = atendimento.ProximoContatoMotivo;
            existente.RetornoConcluido = atendimento.RetornoConcluido;

            if (existente.ProximoContatoData != atendimento.ProximoContatoData)
            {
                existente.ProximoContatoData = atendimento.ProximoContatoData;
                existente.ProximoContatoHora = atendimento.ProximoContatoHora;
                existente.LembreteNivel = 0;
            }

            await _context.SaveChangesAsync();
            return existente;
        }

        public async Task ConcluirRetornoAsync(int id)
        {
            var existente = await _context.Atendimentos.FindAsync(id);
            if (existente == null || !existente.Ativo)
                return;

            if (!existente.RetornoConcluido)
            {
                existente.RetornoConcluido = true;
                existente.LembreteNivel = 0;
                await _context.SaveChangesAsync();
            }
        }

        public async Task ExcluirAsync(int id)
        {
            var existente = await _context.Atendimentos.FindAsync(id);
            if (existente == null || !existente.Ativo)
                throw new KeyNotFoundException();

            existente.Ativo = false;
            await _context.SaveChangesAsync();
        }
    }
}
