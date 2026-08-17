namespace TesisFlow.Modelo.Entidades
{
    public class Mensagem : EntidadeBase
    {
        public int RemetenteId { get; set; }
        public required string Texto { get; set; }
        public int DestinatarioId { get; set; }
        public bool Lida { get; set; }
        public bool Entregue { get; set; }

        public Usuario Remetente { get; set; } = null!;
        public Usuario Destinatario { get; set; } = null!;
    }
}
