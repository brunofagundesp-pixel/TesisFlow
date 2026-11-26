namespace TesisFlow.Modelo.DTOs
{
    public class EscolaCrmDTO
    {
        public int Id { get; set; }
        public int ColegioId { get; set; }
        public string ColegioNome { get; set; } = string.Empty;
        public int EtapaComercial { get; set; }
        public int? ResponsavelId { get; set; }
        public string? ResponsavelNome { get; set; }
        public int? ContatoPrincipalId { get; set; }
        public string? ContatoPrincipalNome { get; set; }
        public string? MotivoEncerramento { get; set; }
        public string? MotivoObservacao { get; set; }
        public DateTime? DataConversao { get; set; }
        public DateTime? UltimoContato { get; set; }
        public DateTime? ProximoContato { get; set; }
        public DateTime DataCriacao { get; set; }
        public DateTime? DataAtualizacao { get; set; }
    }

    public class EscolaCrmSalvarDTO
    {
        public int ColegioId { get; set; }
        public string ColegioNome { get; set; } = string.Empty;
        public int EtapaComercial { get; set; }
        public int? ResponsavelId { get; set; }
        public string? ResponsavelNome { get; set; }
        public int? ContatoPrincipalId { get; set; }
        public string? ContatoPrincipalNome { get; set; }
        public string? MotivoEncerramento { get; set; }
        public string? MotivoObservacao { get; set; }
        public DateTime? DataConversao { get; set; }
    }

    public class EscolaCrmResumoDTO
    {
        public int TotalProspeccao { get; set; }
        public int NaoContatadas { get; set; }
        public int EmAcompanhamento { get; set; }
        public int Interessadas { get; set; }
        public int EmNegociacao { get; set; }
        public int ClientesConquistados { get; set; }
        public int RetornosAtrasados { get; set; }
    }
}
