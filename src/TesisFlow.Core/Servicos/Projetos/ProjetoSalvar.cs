using TesisFlow.Core.Interfaces;
using TesisFlow.Contexto.Contextos;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Servicos.Projetos
{
    public class ProjetoSalvar
    {
        private readonly IProjetoRepositorio _repositorio;
        private readonly IUsuarioRepositorio _usuarioRepositorio;
        private readonly ApplicationDbContextTesisFlow _context;

        public ProjetoSalvar(IProjetoRepositorio repositorio, IUsuarioRepositorio usuarioRepositorio, ApplicationDbContextTesisFlow context)
        {
            _repositorio = repositorio;
            _usuarioRepositorio = usuarioRepositorio;
            _context = context;
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

            await _context.Categorias.AddRangeAsync(CategoriasPadrao(projetoSalvo.Id));
            await _context.SaveChangesAsync();

            return projetoSalvo;
        }

        private static List<Categoria> CategoriasPadrao(int projetoId) => new()
        {
            new Categoria { Nome = "Tarefa", Icone = "task_alt", Cor = "#ff8615", ProjetoId = projetoId },
            new Categoria { Nome = "Bug", Icone = "bug_report", Cor = "#ef4444", ProjetoId = projetoId },
            new Categoria { Nome = "Melhoria", Icone = "auto_awesome", Cor = "#f59e0b", ProjetoId = projetoId },
            new Categoria { Nome = "Historia", Icone = "auto_stories", Cor = "#3d81f4", ProjetoId = projetoId },
        };

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
