using TesisFlow.Modelo.Enums;

namespace TesisFlow.Modelo.Entidades
{
    public class Projeto : EntidadeBase
    {
        public required string Nome { get; set; }
        public string? Descricao { get; set; }
        public string? Cor { get; set; }
        public string? Icone { get; set; }
        public int LiderId { get; set; }

        public Usuario Lider { get; set; } = null!;
        public ICollection<ProjetoMembro> Membros { get; set; } = new List<ProjetoMembro>();
        public ICollection<Sprint> Sprints { get; set; } = new List<Sprint>();
        public ICollection<Tarefa> Tarefas { get; set; } = new List<Tarefa>();
        public ICollection<Categoria> Categorias { get; set; } = new List<Categoria>();
    }
}
