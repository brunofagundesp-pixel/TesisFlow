namespace TesisFlow.Modelo.Entidades
{
    public class HistoricoTarefa
    {
        public int Id { get; set; }
        public int TarefaId { get; set; }
        public required string Campo { get; set; }
        public string? ValorAntigo { get; set; }
        public string? ValorNovo { get; set; }
        public int UsuarioId { get; set; }
        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;
        public bool Ativo { get; set; } = true;

        public Tarefa Tarefa { get; set; } = null!;
        public Usuario Usuario { get; set; } = null!;
    }
}
