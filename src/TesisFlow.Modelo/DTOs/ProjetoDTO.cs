namespace TesisFlow.Modelo.DTOs
{
    public class ProjetoDTO
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public string? Cor { get; set; }
        public string? Icone { get; set; }
        public int LiderId { get; set; }
        public string LiderNome { get; set; } = string.Empty;
        public bool Ativo { get; set; }
        public int QuantidadeTarefas { get; set; }
        public int QuantidadeMembros { get; set; }
        public IEnumerable<ProjetoMembroDTO> Membros { get; set; } = new List<ProjetoMembroDTO>();
        public IEnumerable<ProjetoMembroDTO> Convites { get; set; } = new List<ProjetoMembroDTO>();
    }

    public class ProjetoSalvarDTO
    {
        public required string Nome { get; set; }
        public string? Descricao { get; set; }
        public string? Cor { get; set; }
        public string? Icone { get; set; }
        public int LiderId { get; set; }
    }

    public class ProjetoMembroDTO
    {
        public int Id { get; set; }
        public int ProjetoId { get; set; }
        public int UsuarioId { get; set; }
        public string UsuarioNome { get; set; } = string.Empty;
        public string? UsuarioEmail { get; set; }
        public string? UsuarioFoto { get; set; }
        public string Papel { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }

    public class ConvidarMembroDTO
    {
        public required string Email { get; set; }
    }

    public class MembroAcaoDTO
    {
        public int UsuarioId { get; set; }
    }
}
