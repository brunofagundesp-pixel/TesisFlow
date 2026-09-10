namespace TesisFlow.Modelo.Entidades
{
    public class ColegioNota : EntidadeBase
    {
        public int ColegioId { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string Conteudo { get; set; } = string.Empty;
        public string Cor { get; set; } = string.Empty;
        public bool Fixa { get; set; }
        public int? ParceiroId { get; set; }
        public DateTime? DataFixacao { get; set; }
    }
}
