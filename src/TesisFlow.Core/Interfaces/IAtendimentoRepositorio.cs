using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Interfaces
{
    public interface IAtendimentoRepositorio
    {
        Task<(IEnumerable<Atendimento> Itens, int Total)> ObterAsync(int? colegioId, int? status, string? busca, int top, int skip);
        Task<Atendimento?> ObterPorIdAsync(int id);
        Task<IEnumerable<Atendimento>> ObterRetornosPendentesAsync(int? usuarioId = null);
        Task<DateTime?> ObterUltimoContatoAsync(int colegioId);
        Task<DateTime?> ObterProximoContatoPendenteAsync(int colegioId);
        Task<int> ContarRetornosAtrasadosAsync();
        Task<Atendimento> AdicionarAsync(Atendimento atendimento);
        Task<Atendimento> AtualizarAsync(Atendimento atendimento);
        Task ConcluirRetornoAsync(int id);
        Task ExcluirAsync(int id);
    }
}
