using Microsoft.EntityFrameworkCore;
using TesisFlow.Contexto.Contextos;
using TesisFlow.Core.Interfaces;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Servicos.Atendimentos
{
    public class EscolaCrmRepositorio : IEscolaCrmRepositorio
    {
        private readonly ApplicationDbContextTesisFlow _context;

        public EscolaCrmRepositorio(ApplicationDbContextTesisFlow context)
        {
            _context = context;
        }

        public async Task<IEnumerable<EscolaCrm>> ObterTodosAsync()
        {
            return await _context.EscolasCrm
                .AsNoTracking()
                .Where(e => e.Ativo)
                .OrderBy(e => e.ColegioNome)
                .ToListAsync();
        }

        public async Task<EscolaCrm?> ObterPorColegioAsync(int colegioId)
        {
            return await _context.EscolasCrm
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.Ativo && e.ColegioId == colegioId);
        }

        public async Task<EscolaCrm?> ObterPorIdAsync(int id)
        {
            return await _context.EscolasCrm
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.Id == id && e.Ativo);
        }

        public async Task<EscolaCrm> AdicionarAsync(EscolaCrm escolaCrm)
        {
            _context.EscolasCrm.Add(escolaCrm);
            await _context.SaveChangesAsync();
            return escolaCrm;
        }

        public async Task<EscolaCrm> AtualizarAsync(EscolaCrm escolaCrm, int usuarioId, string usuarioNome)
        {
            var existente = await _context.EscolasCrm.FindAsync(escolaCrm.Id);
            if (existente == null || !existente.Ativo)
                throw new KeyNotFoundException();

            var etapaAnterior = existente.EtapaComercial;
            var etapaMudou = etapaAnterior != escolaCrm.EtapaComercial;

            existente.ColegioNome = escolaCrm.ColegioNome;
            existente.EtapaComercial = escolaCrm.EtapaComercial;
            existente.ResponsavelId = escolaCrm.ResponsavelId;
            existente.ResponsavelNome = escolaCrm.ResponsavelNome;
            existente.ContatoPrincipalId = escolaCrm.ContatoPrincipalId;
            existente.ContatoPrincipalNome = escolaCrm.ContatoPrincipalNome;
            existente.MotivoEncerramento = escolaCrm.MotivoEncerramento;
            existente.MotivoObservacao = escolaCrm.MotivoObservacao;
            existente.DataConversao = escolaCrm.DataConversao;

            if (etapaMudou)
            {
                _context.EscolasCrmHistorico.Add(new EscolaCrmHistorico
                {
                    EscolaCrmId = existente.Id,
                    EtapaAnterior = (int)etapaAnterior,
                    EtapaNova = (int)escolaCrm.EtapaComercial,
                    UsuarioId = usuarioId,
                    UsuarioNome = usuarioNome ?? string.Empty,
                });
            }

            await _context.SaveChangesAsync();
            return existente;
        }

        public async Task AdicionarHistoricoAsync(EscolaCrmHistorico historico)
        {
            _context.EscolasCrmHistorico.Add(historico);
            await _context.SaveChangesAsync();
        }
    }
}
