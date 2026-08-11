using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Interfaces
{
    public interface IQuadroConfiguracaoRepositorio
    {
        Task<IEnumerable<QuadroConfiguracao>> ObterPorProjetoAsync(int projetoId);
        Task<QuadroConfiguracao?> ObterPorIdAsync(int id);
        Task<IEnumerable<QuadroConfiguracao>> AdicionarVariosAsync(IEnumerable<QuadroConfiguracao> quadros);
        Task<QuadroConfiguracao> AtualizarAsync(QuadroConfiguracao quadro);
        Task ExcluirAsync(int id);
        Task ExcluirPorProjetoAsync(int projetoId);
    }
}
