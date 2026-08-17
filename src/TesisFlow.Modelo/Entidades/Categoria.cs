namespace TesisFlow.Modelo.Entidades
{
    public class Categoria : EntidadeBase
    {
        public required string Nome { get; set; }
        public required string Icone { get; set; }
        public string Cor { get; set; } = "#3d81f4";
        public int ProjetoId { get; set; }

        public Projeto Projeto { get; set; } = null!;
        public ICollection<Tarefa> Tarefas { get; set; } = new List<Tarefa>();
    }
}
