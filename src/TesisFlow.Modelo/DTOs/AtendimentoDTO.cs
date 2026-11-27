namespace TesisFlow.Modelo.DTOs
{
    public class AtendimentoDTO
    {
        public int Id { get; set; }
        public int ColegioId { get; set; }
        public string ColegioNome { get; set; } = string.Empty;
        public string Titulo { get; set; } = string.Empty;
        public string Descricao { get; set; } = string.Empty;
        public int Status { get; set; }
        public string? NomeContato { get; set; }
        public int UsuarioId { get; set; }
        public string UsuarioNome { get; set; } = string.Empty;
        public string? UsuarioFoto { get; set; }
        public int? TipoInteracao { get; set; }
        public int? Canal { get; set; }
        public int? Resultado { get; set; }
        public int? ContatoId { get; set; }
        public int? AtendimentoOrigemId { get; set; }
        public DateTime? ProximoContatoData { get; set; }
        public string? ProximoContatoHora { get; set; }
        public string? ProximoContatoMotivo { get; set; }
        public bool RetornoConcluido { get; set; }
        public int LembreteNivel { get; set; }
        public DateTime DataCriacao { get; set; }
        public DateTime? DataAtualizacao { get; set; }
    }

    public class AtendimentoSalvarDTO
    {
        public int ColegioId { get; set; }
        public string ColegioNome { get; set; } = string.Empty;
        public string Titulo { get; set; } = string.Empty;
        public string Descricao { get; set; } = string.Empty;
        public int Status { get; set; }
        public string? NomeContato { get; set; }
        public int? TipoInteracao { get; set; }
        public int? Canal { get; set; }
        public int? Resultado { get; set; }
        public int? ContatoId { get; set; }
        public int? AtendimentoOrigemId { get; set; }
        public DateTime? ProximoContatoData { get; set; }
        public string? ProximoContatoHora { get; set; }
        public string? ProximoContatoMotivo { get; set; }
        public bool RetornoConcluido { get; set; }
    }
}
