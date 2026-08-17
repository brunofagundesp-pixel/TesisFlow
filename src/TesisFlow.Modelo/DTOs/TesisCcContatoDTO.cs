using System.Text.Json.Serialization;

namespace TesisFlow.Modelo.DTOs
{
    public class TesisCcContatoDTO
    {
        [JsonPropertyName("idContato")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public int? IdContato { get; set; }

        [JsonPropertyName("idColegio")]
        public int IdColegio { get; set; }

        [JsonPropertyName("dataContato")]
        public string DataContato { get; set; } = string.Empty;

        [JsonPropertyName("idStatusContato")]
        public int IdStatusContato { get; set; }

        [JsonPropertyName("referencia")]
        public string Referencia { get; set; } = string.Empty;

        [JsonPropertyName("nomeContato")]
        public string? NomeContato { get; set; }

        [JsonPropertyName("detalhes")]
        public string? Detalhes { get; set; }

        [JsonPropertyName("protocoloComentario")]
        public string? ProtocoloComentario { get; set; }
    }
}
