using TesisFlow.Core.Interfaces;
using TesisFlow.Modelo.DTOs;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Servicos.Atendimentos
{
    public class ContatoConsultar
    {
        private readonly IContatoRepositorio _repositorio;

        public ContatoConsultar(IContatoRepositorio repositorio)
        {
            _repositorio = repositorio;
        }

        public async Task<IEnumerable<ContatoDTO>> ObterPorColegioAsync(int colegioId)
        {
            var contatos = await _repositorio.ObterPorColegioAsync(colegioId);
            return contatos.Select(Mapear).ToList();
        }

        public async Task<ContatoDTO?> ObterPorIdAsync(int id)
        {
            var c = await _repositorio.ObterPorIdAsync(id);
            return c == null ? null : Mapear(c);
        }

        internal static ContatoDTO Mapear(Contato c) => new()
        {
            Id = c.Id,
            ColegioId = c.ColegioId,
            Nome = c.Nome,
            Telefone = c.Telefone,
            Email = c.Email,
            Cargo = c.Cargo,
        };
    }
}
