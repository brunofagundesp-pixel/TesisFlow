using TesisFlow.Core.Interfaces;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Servicos.Projetos
{
    public class ProjetoSalvar
    {
        private readonly IProjetoRepositorio _repositorio;
        private readonly IUsuarioRepositorio _usuarioRepositorio;

        public ProjetoSalvar(IProjetoRepositorio repositorio, IUsuarioRepositorio usuarioRepositorio)
        {
            _repositorio = repositorio;
            _usuarioRepositorio = usuarioRepositorio;
        }

        public async Task<Projeto> CriarAsync(string nome, string? descricao, string? cor, string? icone, int liderId)
        {
            var lider = await _usuarioRepositorio.ObterPorIdAsync(liderId)
                ?? throw new KeyNotFoundException("Líder não encontrado.");

            var projeto = new Projeto
            {
                Nome = nome,
                Descricao = descricao,
                Cor = cor ?? "#ff8615",
                Icone = icone,
                LiderId = liderId
            };

            var projetoSalvo = await _repositorio.AdicionarAsync(projeto);

            return projetoSalvo;
        }

        public async Task<Projeto> AtualizarAsync(int id, string nome, string? descricao, string? cor, string? icone, int liderId)
        {
            var projeto = await _repositorio.ObterPorIdAsync(id)
                ?? throw new KeyNotFoundException("Projeto não encontrado.");

            projeto.Nome = nome;
            projeto.Descricao = descricao;
            projeto.Cor = cor;
            projeto.Icone = icone;
            projeto.LiderId = liderId;

            return await _repositorio.AtualizarAsync(projeto);
        }

        public async Task AdicionarMembroAsync(int projetoId, string email)
        {
            var usuario = await _usuarioRepositorio.ObterPorEmailAsync(email)
                ?? throw new KeyNotFoundException("Usuario nao encontrado.");

            await _repositorio.AdicionarMembroAsync(projetoId, usuario.Id);
        }
    }
}
