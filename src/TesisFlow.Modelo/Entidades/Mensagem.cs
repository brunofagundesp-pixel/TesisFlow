namespace TesisFlow.Modelo.Entidades
{
    public class Mensagem : EntidadeBase
    {
        public int RemetenteId { get; set; }
        public required string Texto { get; set; }
        public int DestinatarioId { get; set; }
        public bool Lida { get; set; }
        public bool Entregue { get; set; }
        public string? Audio { get; set; }
        public int? AudioDuracao { get; set; }
        public int? MensagemRespondidaId { get; set; }
        public string? VinculoTipo { get; set; }
        public int? VinculoId { get; set; }
        public string? VinculoTitulo { get; set; }
        public string? VinculoSubtitulo { get; set; }
        public string? VinculoLink { get; set; }
        public string? VinculoIcone { get; set; }
        public string? Imagem { get; set; }
        public string? ImagemNome { get; set; }

        public Usuario Remetente { get; set; } = null!;
        public Usuario Destinatario { get; set; } = null!;
        public Mensagem? MensagemRespondida { get; set; }
    }
}
