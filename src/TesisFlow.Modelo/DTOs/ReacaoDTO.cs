namespace TesisFlow.Modelo.DTOs
{
    public class ReacaoDTO
    {
        public string Emoji { get; set; } = string.Empty;
        public int Quantidade { get; set; }
        public List<ReacaoUsuarioDTO> Usuarios { get; set; } = new();
    }

    public class ReacaoUsuarioDTO
    {
        public int UsuarioId { get; set; }
        public string UsuarioNome { get; set; } = string.Empty;
    }

    public class ReacaoSalvarDTO
    {
        public required string Emoji { get; set; }
        public int UsuarioId { get; set; }
    }
}
