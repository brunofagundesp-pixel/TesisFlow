namespace TesisFlow.Modelo.DTOs
{
    public class MensagemDTO
    {
        public int Id { get; set; }
        public int RemetenteId { get; set; }
        public string RemetenteNome { get; set; } = string.Empty;
        public int DestinatarioId { get; set; }
        public string Texto { get; set; } = string.Empty;
        public bool Lida { get; set; }
        public bool Entregue { get; set; }
        public DateTime DataCriacao { get; set; }
    }

    public class MensagemSalvarDTO
    {
        public required string Texto { get; set; }
        public int RemetenteId { get; set; }
        public int DestinatarioId { get; set; }
    }

    public class ContatoChatDTO
    {
        public int UsuarioId { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string UltimaMensagem { get; set; } = string.Empty;
        public DateTime? UltimaData { get; set; }
        public int NaoLidas { get; set; }
    }
}
