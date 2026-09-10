using Microsoft.EntityFrameworkCore;
using TesisFlow.Contexto.Contextos;
using TesisFlow.Core.Interfaces;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Servicos.ColegioNotas
{
    public class ColegioNotaRepositorio : IColegioNotaRepositorio
    {
        private readonly ApplicationDbContextTesisFlow _context;

        public ColegioNotaRepositorio(ApplicationDbContextTesisFlow context)
        {
            _context = context;
        }

        public async Task<(IEnumerable<ColegioNota> Itens, int Total)> ObterPorColegioAsync(int colegioId, int top, int skip)
        {
            var query = _context.ColegioNotas
                .AsNoTracking()
                .Where(n => n.ColegioId == colegioId && n.Ativo);

            var total = await query.CountAsync();

            var itens = await query
                .OrderByDescending(n => n.Fixa)
                .ThenByDescending(n => n.DataFixacao)
                .ThenByDescending(n => n.Id)
                .Skip(skip)
                .Take(top)
                .ToListAsync();

            return (itens, total);
        }

        public async Task<HashSet<int>> ObterParceiroIdsAsync(int colegioId)
        {
            var ids = await _context.ColegioNotas
                .AsNoTracking()
                .Where(n => n.ColegioId == colegioId && n.Ativo && n.ParceiroId != null)
                .Select(n => n.ParceiroId!.Value)
                .ToListAsync();

            return ids.ToHashSet();
        }

        public async Task<ColegioNota> AdicionarAsync(ColegioNota nota)
        {
            _context.ColegioNotas.Add(nota);
            await _context.SaveChangesAsync();
            return nota;
        }

        public async Task<ColegioNota> AtualizarAsync(ColegioNota nota)
        {
            var existente = await _context.ColegioNotas.FindAsync(nota.Id);
            if (existente == null || !existente.Ativo)
                throw new KeyNotFoundException();

            existente.Titulo = nota.Titulo;
            existente.Conteudo = nota.Conteudo;
            existente.Cor = nota.Cor;

            if (!existente.Fixa && nota.Fixa)
            {
                existente.DataFixacao = DateTime.UtcNow;
            }
            else if (existente.Fixa && !nota.Fixa)
            {
                existente.DataFixacao = null;
            }

            existente.Fixa = nota.Fixa;

            await _context.SaveChangesAsync();
            return existente;
        }

        public async Task ExcluirAsync(int id)
        {
            var existente = await _context.ColegioNotas.FindAsync(id);
            if (existente == null || !existente.Ativo)
                throw new KeyNotFoundException();

            existente.Ativo = false;
            await _context.SaveChangesAsync();
        }
    }
}
