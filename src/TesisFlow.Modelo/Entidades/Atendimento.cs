namespace TesisFlow.Modelo.Entidades
{
    public class Atendimento : EntidadeBase
    {
        public int ColegioId { get; set; }
        public string ColegioNome { get; set; } = string.Empty;
        public string Titulo { get; set; } = string.Empty;
        public string Descricao { get; set; } = string.Empty;
        public int Status { get; set; }
        public string? NomeContato { get; set; }
        public int UsuarioId { get; set; }
        public string UsuarioNome { get; set; } = string.Empty;

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
    }
}
