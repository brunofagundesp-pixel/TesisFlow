namespace TesisFlow.Modelo.Entidades
{
    public class Sprint : EntidadeBase
    {
        public required string Nome { get; set; }
        public string? Descricao { get; set; }
        public DateTime DataInicio { get; set; }
        public DateTime DataFim { get; set; }
        public int ProjetoId { get; set; }

        public Projeto Projeto { get; set; } = null!;
        public ICollection<Tarefa> Tarefas { get; set; } = new List<Tarefa>();
    }
}
