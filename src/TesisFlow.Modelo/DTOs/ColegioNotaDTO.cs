namespace TesisFlow.Modelo.DTOs
{
    public class ColegioNotaDTO
    {
        public int Id { get; set; }
        public int ColegioId { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string Conteudo { get; set; } = string.Empty;
        public string Cor { get; set; } = string.Empty;
        public bool Fixa { get; set; }
        public int? ParceiroId { get; set; }
        public DateTime DataCriacao { get; set; }
        public DateTime? DataAtualizacao { get; set; }
        public DateTime? DataFixacao { get; set; }
    }

    public class ColegioNotaSalvarDTO
    {
        public int ColegioId { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string Conteudo { get; set; } = string.Empty;
        public string Cor { get; set; } = string.Empty;
        public bool Fixa { get; set; }
    }
}
