using Microsoft.EntityFrameworkCore;
using TesisFlow.Contexto.Contextos;
using TesisFlow.Core.Interfaces;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Servicos.Atendimentos
{
    public class ContatoRepositorio : IContatoRepositorio
    {
        private readonly ApplicationDbContextTesisFlow _context;

        public ContatoRepositorio(ApplicationDbContextTesisFlow context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Contato>> ObterPorColegioAsync(int colegioId)
        {
            return await _context.Contatos
                .AsNoTracking()
                .Where(c => c.Ativo && c.ColegioId == colegioId)
                .OrderBy(c => c.Nome)
                .ToListAsync();
        }

        public async Task<Contato?> ObterPorIdAsync(int id)
        {
            return await _context.Contatos
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == id && c.Ativo);
        }

        public async Task<Contato> AdicionarAsync(Contato contato)
        {
            _context.Contatos.Add(contato);
            await _context.SaveChangesAsync();
            return contato;
        }

        public async Task<Contato> AtualizarAsync(Contato contato)
        {
            var existente = await _context.Contatos.FindAsync(contato.Id);
            if (existente == null || !existente.Ativo)
                throw new KeyNotFoundException();

            existente.ColegioId = contato.ColegioId;
            existente.Nome = contato.Nome;
            existente.Telefone = contato.Telefone;
            existente.Email = contato.Email;
            existente.Cargo = contato.Cargo;

            await _context.SaveChangesAsync();
            return existente;
        }

        public async Task ExcluirAsync(int id)
        {
            var existente = await _context.Contatos.FindAsync(id);
            if (existente == null || !existente.Ativo)
                throw new KeyNotFoundException();

            existente.Ativo = false;
            await _context.SaveChangesAsync();
        }
    }
}
