namespace TesisFlow.Modelo.Entidades
{
    public class TarefaResponsavel : EntidadeBase
    {
        public int TarefaId { get; set; }
        public int UsuarioId { get; set; }

        public Tarefa Tarefa { get; set; } = null!;
        public Usuario Usuario { get; set; } = null!;
    }
}
