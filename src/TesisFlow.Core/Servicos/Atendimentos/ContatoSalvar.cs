using TesisFlow.Core.Interfaces;
using TesisFlow.Modelo.DTOs;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Servicos.Atendimentos
{
    public class ContatoSalvar
    {
        private readonly IContatoRepositorio _repositorio;

        public ContatoSalvar(IContatoRepositorio repositorio)
        {
            _repositorio = repositorio;
        }

        public async Task<ContatoDTO> CriarAsync(ContatoSalvarDTO dto)
        {
            var contato = new Contato
            {
                ColegioId = dto.ColegioId,
                Nome = dto.Nome ?? string.Empty,
                Telefone = dto.Telefone,
                Email = dto.Email,
                Cargo = dto.Cargo,
            };

            var salvo = await _repositorio.AdicionarAsync(contato);
            return ContatoConsultar.Mapear(salvo);
        }

        public async Task<ContatoDTO> AtualizarAsync(int id, ContatoSalvarDTO dto)
        {
            var contato = new Contato
            {
                Id = id,
                ColegioId = dto.ColegioId,
                Nome = dto.Nome ?? string.Empty,
                Telefone = dto.Telefone,
                Email = dto.Email,
                Cargo = dto.Cargo,
            };

            var salvo = await _repositorio.AtualizarAsync(contato);
            return ContatoConsultar.Mapear(salvo);
        }
    }
}
