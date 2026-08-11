namespace TesisFlow.Modelo.DTOs
{
    public class SprintDTO
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public DateTime DataInicio { get; set; }
        public DateTime DataFim { get; set; }
        public int ProjetoId { get; set; }
        public string ProjetoNome { get; set; } = string.Empty;
        public bool Ativo { get; set; }
        public int QuantidadeTarefas { get; set; }
    }

    public class SprintSalvarDTO
    {
        public required string Nome { get; set; }
        public string? Descricao { get; set; }
        public DateTime DataInicio { get; set; }
        public DateTime DataFim { get; set; }
        public int ProjetoId { get; set; }
    }
}
