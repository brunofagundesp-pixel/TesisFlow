using TesisFlow.Modelo.Enums;

namespace TesisFlow.Modelo.DTOs
{
    public class QuadroConfiguracaoDTO
    {
        public int Id { get; set; }
        public int ProjetoId { get; set; }
        public StatusTarefa Status { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public int Ordem { get; set; }
        public bool Visivel { get; set; }
    }

    public class QuadroConfiguracaoSalvarDTO
    {
        public StatusTarefa Status { get; set; }
        public required string Titulo { get; set; }
        public int Ordem { get; set; }
        public bool Visivel { get; set; } = true;
    }
}
