using System.Text.Json.Serialization;

namespace TesisFlow.Modelo.DTOs
{
    public class ColegioDTO
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string Apelido { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Estado { get; set; } = string.Empty;
        public string Cidade { get; set; } = string.Empty;
        public string Contato { get; set; } = string.Empty;
        public string Telefone { get; set; } = string.Empty;
        public string CodigoDiario { get; set; } = string.Empty;
        public string SenhaMasterDiario { get; set; } = string.Empty;
        public string CodigoPortalAluno { get; set; } = string.Empty;
        public string CodigoAplicativo { get; set; } = string.Empty;
        public string ApelidoAplicativo { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string LinkTGE { get; set; } = string.Empty;
        public string Cnpj { get; set; } = string.Empty;
        public string Endereco { get; set; } = string.Empty;
        public string Bairro { get; set; } = string.Empty;
        public string Cep { get; set; } = string.Empty;
        public string IdTesis { get; set; } = string.Empty;
        public int? IdDiarioRaw { get; set; }
    }

    public class ColegioODataDTO
    {
        [JsonPropertyName("idColegio")]
        public int IdColegio { get; set; }

        [JsonPropertyName("idTesis")]
        public string? IdTesis { get; set; }

        [JsonPropertyName("nome")]
        public string? Nome { get; set; }

        [JsonPropertyName("situacao")]
        public string? Situacao { get; set; }

        [JsonPropertyName("apelido")]
        public string? Apelido { get; set; }

        [JsonPropertyName("contato")]
        public string? Contato { get; set; }

        [JsonPropertyName("telefone")]
        public string? Telefone { get; set; }

        [JsonPropertyName("email")]
        public string? Email { get; set; }

        [JsonPropertyName("municipio")]
        public string? Municipio { get; set; }

        [JsonPropertyName("uf")]
        public string? Uf { get; set; }

        [JsonPropertyName("idDiario")]
        public int? IdDiario { get; set; }

        [JsonPropertyName("idPortalAluno")]
        public string? IdPortalAluno { get; set; }

        [JsonPropertyName("cnpj")]
        public string? Cnpj { get; set; }

        [JsonPropertyName("endereco")]
        public string? Endereco { get; set; }

        [JsonPropertyName("bairro")]
        public string? Bairro { get; set; }

        [JsonPropertyName("cep")]
        public string? Cep { get; set; }
    }

    public class ColegioODataResponseDTO
    {
        [JsonPropertyName("value")]
        public List<ColegioODataDTO> Value { get; set; } = new();

        [JsonPropertyName("@odata.count")]
        public int? Count { get; set; }
    }
}
