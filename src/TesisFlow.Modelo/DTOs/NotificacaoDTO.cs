namespace TesisFlow.Modelo.DTOs
{
    public class NotificacaoDTO
    {
        public int Id { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public string Tipo { get; set; } = string.Empty;
        public string? Link { get; set; }
        public bool Lida { get; set; }
        public DateTime DataCriacao { get; set; }
        public int? TargetUserId { get; set; }
        public int? TarefaId { get; set; }
        public int? ProjetoId { get; set; }
    }

    public class NotificacaoSalvarDTO
    {
        public required string Titulo { get; set; }
        public string? Descricao { get; set; }
        public required string Tipo { get; set; }
        public string? Link { get; set; }
        public int? TargetUserId { get; set; }
        public int? TarefaId { get; set; }
        public int? ProjetoId { get; set; }
    }
}
