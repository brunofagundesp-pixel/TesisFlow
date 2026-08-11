namespace TesisFlow.Modelo.DTOs
{
    public class HistoricoTarefaDTO
    {
        public int Id { get; set; }
        public int TarefaId { get; set; }
        public string Campo { get; set; } = string.Empty;
        public string? ValorAntigo { get; set; }
        public string? ValorNovo { get; set; }
        public int UsuarioId { get; set; }
        public string UsuarioNome { get; set; } = string.Empty;
        public DateTime DataCriacao { get; set; }
    }
}
