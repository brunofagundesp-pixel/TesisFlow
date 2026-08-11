namespace TesisFlow.Modelo.Entidades
{
    public class Comentario : EntidadeBase
    {
        public required string Texto { get; set; }
        public int TarefaId { get; set; }
        public int UsuarioId { get; set; }
        public int? ComentarioPaiId { get; set; }
        public int Curtidas { get; set; }

        public Tarefa Tarefa { get; set; } = null!;
        public Usuario Usuario { get; set; } = null!;
        public Comentario? ComentarioPai { get; set; }
        public ICollection<Comentario> Respostas { get; set; } = new List<Comentario>();
    }
}
