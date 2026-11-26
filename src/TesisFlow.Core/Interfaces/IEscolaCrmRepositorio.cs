using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Interfaces
{
    public interface IEscolaCrmRepositorio
    {
        Task<IEnumerable<EscolaCrm>> ObterTodosAsync();
        Task<EscolaCrm?> ObterPorColegioAsync(int colegioId);
        Task<EscolaCrm?> ObterPorColegioIncluindoInativoAsync(int colegioId);
        Task<EscolaCrm?> ObterPorIdAsync(int id);
        Task<EscolaCrm> AdicionarAsync(EscolaCrm escolaCrm);
        Task<EscolaCrm> ReativarAsync(EscolaCrm escolaCrm);
        Task<EscolaCrm> AtualizarAsync(EscolaCrm escolaCrm, int usuarioId, string usuarioNome);
        Task AdicionarHistoricoAsync(EscolaCrmHistorico historico);
        Task ExcluirAsync(int id);
    }
}
