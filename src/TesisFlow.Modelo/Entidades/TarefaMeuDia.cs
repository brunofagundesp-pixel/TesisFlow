namespace TesisFlow.Modelo.Entidades
{
    public class TarefaMeuDia : EntidadeBase
    {
        public int TarefaId { get; set; }
        public int UsuarioId { get; set; }
        public DateTime Data { get; set; } = DateTime.Today;

        public Tarefa Tarefa { get; set; } = null!;
        public Usuario Usuario { get; set; } = null!;
    }
}
