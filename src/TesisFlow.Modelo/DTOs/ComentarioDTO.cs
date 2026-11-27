namespace TesisFlow.Modelo.DTOs
{
    public class ComentarioDTO
    {
        public int Id { get; set; }
        public string Texto { get; set; } = string.Empty;
        public int TarefaId { get; set; }
        public int UsuarioId { get; set; }
        public string UsuarioNome { get; set; } = string.Empty;
        public string? UsuarioFoto { get; set; }
        public int? ComentarioPaiId { get; set; }
        public int Curtidas { get; set; }
        public DateTime DataCriacao { get; set; }
    }

    public class ComentarioSalvarDTO
    {
        public required string Texto { get; set; }
        public int TarefaId { get; set; }
        public int UsuarioId { get; set; }
        public int? ComentarioPaiId { get; set; }
    }

    public class ComentariosPaginadoDTO
    {
        public List<ComentarioDTO> Comentarios { get; set; } = new();
        public bool TemMais { get; set; }
    }
}
