namespace TesisFlow.Modelo.Entidades
{
    public class Anexo : EntidadeBase
    {
        public int TarefaId { get; set; }
        public required string NomeArquivo { get; set; }
        public required string Caminho { get; set; }
        public string Tipo { get; set; } = "application/octet-stream";
        public long Tamanho { get; set; }
        public int UsuarioId { get; set; }

        public Tarefa Tarefa { get; set; } = null!;
        public Usuario Usuario { get; set; } = null!;
    }
}
