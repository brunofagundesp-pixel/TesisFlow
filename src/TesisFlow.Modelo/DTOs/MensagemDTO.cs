namespace TesisFlow.Modelo.DTOs
{
    public class MensagemDTO
    {
        public int Id { get; set; }
        public int RemetenteId { get; set; }
        public string RemetenteNome { get; set; } = string.Empty;
        public string? RemetenteFoto { get; set; }
        public int? DestinatarioId { get; set; }
        public string DestinatarioNome { get; set; } = string.Empty;
        public string? DestinatarioFoto { get; set; }
        public int? GrupoId { get; set; }
        public string? GrupoNome { get; set; }
        public string Texto { get; set; } = string.Empty;
        public bool Lida { get; set; }
        public bool Entregue { get; set; }
        public int? LidaPor { get; set; }
        public int? TotalParticipantes { get; set; }
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

    public class MensagemBuscaDTO
    {
        public int Id { get; set; }
        public int RemetenteId { get; set; }
        public string RemetenteNome { get; set; } = string.Empty;
        public int? DestinatarioId { get; set; }
        public string Texto { get; set; } = string.Empty;
        public DateTime DataCriacao { get; set; }
        public string? ImagemNome { get; set; }
        public string? VinculoTitulo { get; set; }
        public int ContatoId { get; set; }
        public string ContatoNome { get; set; } = string.Empty;
        public string? ContatoFoto { get; set; }
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

    public class GrupoChatDTO
    {
        public int GrupoId { get; set; }
        public int CriadorId { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string UltimaMensagem { get; set; } = string.Empty;
        public DateTime? UltimaData { get; set; }
        public int NaoLidas { get; set; }
        public List<GrupoParticipanteDTO> Participantes { get; set; } = new();
    }

    public class GrupoParticipanteDTO
    {
        public int UsuarioId { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string? Foto { get; set; }
    }

    public class GrupoCriarDTO
    {
        public int RemetenteId { get; set; }
        public string Nome { get; set; } = string.Empty;
        public List<int> ParticipanteIds { get; set; } = new();
        public string Texto { get; set; } = string.Empty;
    }

    public class GrupoEnviarDTO
    {
        public int RemetenteId { get; set; }
        public string Texto { get; set; } = string.Empty;
        public int? MensagemRespondidaId { get; set; }
        public VinculoSalvarDTO? Vinculo { get; set; }
    }

    public class GrupoAdicionarParticipanteDTO
    {
        public int SolicitanteId { get; set; }
        public int UsuarioId { get; set; }
    }
}
