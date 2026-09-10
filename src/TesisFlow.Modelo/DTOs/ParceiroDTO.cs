namespace TesisFlow.Modelo.DTOs
{
    public class ParceiroDTO
    {
        public int IdParceiro { get; set; }
        public int IdColegio { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string Telefone1 { get; set; } = string.Empty;
        public string Telefone2 { get; set; } = string.Empty;
        public string Telefone3 { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
    }
}
