namespace TesisFlow.Modelo.DTOs
{
    public class AnexoDTO
    {
        public int Id { get; set; }
        public int TarefaId { get; set; }
        public string NomeArquivo { get; set; } = string.Empty;
        public string Tipo { get; set; } = string.Empty;
        public long Tamanho { get; set; }
        public int UsuarioId { get; set; }
        public string UsuarioNome { get; set; } = string.Empty;
        public DateTime DataCriacao { get; set; }
    }
}
