namespace TesisFlow.Modelo.Entidades
{
    public class ComentarioReacao
    {
        public int Id { get; set; }
        public int ComentarioId { get; set; }
        public int UsuarioId { get; set; }
        public required string Emoji { get; set; }
        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;
        public bool Ativo { get; set; } = true;

        public Comentario Comentario { get; set; } = null!;
        public Usuario Usuario { get; set; } = null!;
    }
}
