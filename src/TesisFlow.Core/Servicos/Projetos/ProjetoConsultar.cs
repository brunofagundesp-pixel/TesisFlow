using TesisFlow.Core.Interfaces;
using TesisFlow.Modelo.DTOs;
using TesisFlow.Modelo.Entidades;
using TesisFlow.Modelo.Enums;

namespace TesisFlow.Core.Servicos.Projetos
{
    public class ProjetoConsultar
    {
        private readonly IProjetoRepositorio _repositorio;

        public ProjetoConsultar(IProjetoRepositorio repositorio)
        {
            _repositorio = repositorio;
        }

        public async Task<IEnumerable<ProjetoDTO>> ObterTodosAsync()
        {
            var projetos = await _repositorio.ObterTodosAsync();
            var contagens = await _repositorio.ObterQuantidadeTarefasAsync();
            return projetos.Select(p => MapToDTO(p, contagens.GetValueOrDefault(p.Id, 0)));
        }

        public async Task<ProjetoDTO?> ObterPorIdAsync(int id)
        {
            var projeto = await _repositorio.ObterPorIdAsync(id);
            if (projeto == null) return null;
            var contagens = await _repositorio.ObterQuantidadeTarefasAsync();
            return MapToDTO(projeto, contagens.GetValueOrDefault(projeto.Id, 0));
        }

        public async Task<IEnumerable<ProjetoDTO>> ObterPorUsuarioAsync(int usuarioId)
        {
            var projetos = await _repositorio.ObterPorUsuarioAsync(usuarioId);
            var contagens = await _repositorio.ObterQuantidadeTarefasAsync();
            return projetos.Select(p => MapToDTO(p, contagens.GetValueOrDefault(p.Id, 0)));
        }

        private static ProjetoDTO MapToDTO(Projeto p, int quantidadeTarefas = 0)
        {
            var membros = p.Membros?.Select(m => new ProjetoMembroDTO
            {
                Id = m.Id,
                ProjetoId = m.ProjetoId,
                UsuarioId = m.UsuarioId,
                UsuarioNome = m.Usuario?.Nome ?? string.Empty,
                UsuarioEmail = m.Usuario?.Email,
                UsuarioFoto = m.Usuario?.Foto,
                Papel = m.Papel.ToString(),
                Status = m.Status.ToString()
            }).ToList() ?? new List<ProjetoMembroDTO>();

            return new ProjetoDTO
            {
                Id = p.Id,
                Nome = p.Nome,
                Descricao = p.Descricao,
                Cor = p.Cor,
                Icone = p.Icone,
                LiderId = p.LiderId,
                LiderNome = p.Lider?.Nome ?? string.Empty,
                Ativo = p.Ativo,
                QuantidadeTarefas = quantidadeTarefas,
                QuantidadeMembros = membros.Count(m => m.Status == StatusConvite.Aceito.ToString()),
                Membros = membros.Where(m => m.Status == StatusConvite.Aceito.ToString()).ToList(),
                Convites = membros.Where(m => m.Status == StatusConvite.Pendente.ToString()).ToList()
            };
        }
    }
}
