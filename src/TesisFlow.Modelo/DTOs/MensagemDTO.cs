namespace TesisFlow.Modelo.DTOs
{
    public class MensagemDTO
    {
        public int Id { get; set; }
        public int RemetenteId { get; set; }
        public string RemetenteNome { get; set; } = string.Empty;
        public string? RemetenteFoto { get; set; }
        public int DestinatarioId { get; set; }
        public string Texto { get; set; } = string.Empty;
        public bool Lida { get; set; }
        public bool Entregue { get; set; }
        public DateTime DataCriacao { get; set; }
        public string? Audio { get; set; }
        public int? AudioDuracao { get; set; }
        public int? MensagemRespondidaId { get; set; }
        public MensagemRespostaDTO? MensagemRespondida { get; set; }
        public VinculoDTO? Vinculo { get; set; }
        public string? Imagem { get; set; }
        public string? ImagemNome { get; set; }
    }

    public class VinculoDTO
    {
        public string Tipo { get; set; } = string.Empty;
        public int Id { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string Subtitulo { get; set; } = string.Empty;
        public string Link { get; set; } = string.Empty;
        public string Icone { get; set; } = string.Empty;
    }

    public class VinculoSalvarDTO
    {
        public required string Tipo { get; set; }
        public int Id { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string Subtitulo { get; set; } = string.Empty;
        public string Link { get; set; } = string.Empty;
        public string Icone { get; set; } = string.Empty;
    }

    public class MensagemRespostaDTO
    {
        public int Id { get; set; }
        public string Texto { get; set; } = string.Empty;
        public string? Audio { get; set; }
        public string? Imagem { get; set; }
        public string RemetenteNome { get; set; } = string.Empty;
    }

    public class MensagemSalvarDTO
    {
        public required string Texto { get; set; }
        public int RemetenteId { get; set; }
        public int DestinatarioId { get; set; }
        public int? MensagemRespondidaId { get; set; }
        public VinculoSalvarDTO? Vinculo { get; set; }
    }

    public class ContatoChatDTO
    {
        public int UsuarioId { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string? Foto { get; set; }
        public string UltimaMensagem { get; set; } = string.Empty;
        public DateTime? UltimaData { get; set; }
        public int NaoLidas { get; set; }
    }
}
