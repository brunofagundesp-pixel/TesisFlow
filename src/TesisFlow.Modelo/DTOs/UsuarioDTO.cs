namespace TesisFlow.Modelo.DTOs
{
    public class UsuarioDTO
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Foto { get; set; }
        public string? Banner { get; set; }
        public string? Cargo { get; set; }
        public bool Ativo { get; set; }
    }

    public class UsuarioLoginDTO
    {
        public required string Email { get; set; }
        public required string Senha { get; set; }
    }

    public class UsuarioRegistroDTO
    {
        public required string Nome { get; set; }
        public required string Email { get; set; }
        public required string Senha { get; set; }
    }

    public class LoginResponseDTO
    {
        public required string Token { get; set; }
        public UsuarioDTO Usuario { get; set; } = null!;
    }
}
