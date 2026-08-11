using Microsoft.EntityFrameworkCore;
using TesisFlow.Contexto.Contextos;
using TesisFlow.Core.Interfaces;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Servicos.QuadroConfiguracoes
{
    public class QuadroConfiguracaoRepositorio : IQuadroConfiguracaoRepositorio
    {
        private readonly ApplicationDbContextTesisFlow _context;

        public QuadroConfiguracaoRepositorio(ApplicationDbContextTesisFlow context)
        {
            _context = context;
        }

        public async Task<IEnumerable<QuadroConfiguracao>> ObterPorProjetoAsync(int projetoId)
        {
            return await _context.QuadroConfiguracoes
                .Where(q => q.ProjetoId == projetoId && q.Ativo && q.Visivel)
                .OrderBy(q => q.Ordem)
                .ToListAsync();
        }

        public async Task<QuadroConfiguracao?> ObterPorIdAsync(int id)
        {
            return await _context.QuadroConfiguracoes
                .FirstOrDefaultAsync(q => q.Id == id && q.Ativo);
        }

        public async Task<IEnumerable<QuadroConfiguracao>> AdicionarVariosAsync(IEnumerable<QuadroConfiguracao> quadros)
        {
            await _context.QuadroConfiguracoes.AddRangeAsync(quadros);
            await _context.SaveChangesAsync();
            return quadros;
        }

        public async Task<QuadroConfiguracao> AtualizarAsync(QuadroConfiguracao quadro)
        {
            _context.QuadroConfiguracoes.Update(quadro);
            await _context.SaveChangesAsync();
            return quadro;
        }

        public async Task ExcluirAsync(int id)
        {
            var quadro = await _context.QuadroConfiguracoes.FindAsync(id);
            if (quadro != null)
            {
                quadro.Ativo = false;
                await _context.SaveChangesAsync();
            }
        }

        public async Task ExcluirPorProjetoAsync(int projetoId)
        {
            var quadros = await _context.QuadroConfiguracoes
                .Where(q => q.ProjetoId == projetoId)
                .ToListAsync();

            foreach (var q in quadros)
                q.Ativo = false;

            await _context.SaveChangesAsync();
        }
    }
}
