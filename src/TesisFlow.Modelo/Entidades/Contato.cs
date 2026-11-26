namespace TesisFlow.Modelo.Entidades
{
    public class Contato : EntidadeBase
    {
        public int ColegioId { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string? Telefone { get; set; }
        public string? Email { get; set; }
        public string? Cargo { get; set; }
    }
}
