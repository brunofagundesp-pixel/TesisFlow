using TesisFlow.Modelo.Enums;

namespace TesisFlow.Modelo.Entidades
{
    public class EscolaCrm : EntidadeBase
    {
        public int ColegioId { get; set; }
        public string ColegioNome { get; set; } = string.Empty;
        public EtapaComercial EtapaComercial { get; set; } = EtapaComercial.NaoContatada;
        public int? ResponsavelId { get; set; }
        public string? ResponsavelNome { get; set; }
        public int? ContatoPrincipalId { get; set; }
        public string? ContatoPrincipalNome { get; set; }
        public string? MotivoEncerramento { get; set; }
        public string? MotivoObservacao { get; set; }
        public DateTime? DataConversao { get; set; }
    }
}
