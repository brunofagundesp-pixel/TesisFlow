namespace TesisFlow.Modelo.DTOs
{
    public class ContatoDTO
    {
        public int Id { get; set; }
        public int ColegioId { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string? Telefone { get; set; }
        public string? Email { get; set; }
        public string? Cargo { get; set; }
    }

    public class ContatoSalvarDTO
    {
        public int ColegioId { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string? Telefone { get; set; }
        public string? Email { get; set; }
        public string? Cargo { get; set; }
    }
}
