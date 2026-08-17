using TesisFlow.Modelo.Enums;

namespace TesisFlow.Modelo.DTOs
{
    public class ResponsavelDTO
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string? Foto { get; set; }
    }

    public class TarefaDTO
    {
        public int Id { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string? Chave { get; set; }
        public string? Descricao { get; set; }
        public StatusTarefa Status { get; set; }
        public PrioridadeTarefa Prioridade { get; set; }
        public int Tipo { get; set; }
        public string CategoriaNome { get; set; } = string.Empty;
        public string CategoriaIcone { get; set; } = string.Empty;
        public string CategoriaCor { get; set; } = string.Empty;
        public int Ordem { get; set; }
        public int ProjetoId { get; set; }
        public string ProjetoNome { get; set; } = string.Empty;
        public int? SprintId { get; set; }
        public string? SprintNome { get; set; }
        public List<ResponsavelDTO> Responsaveis { get; set; } = new();
        public int CriadorId { get; set; }
        public string CriadorNome { get; set; } = string.Empty;
        public int? ColegioId { get; set; }
        public string? ColegioNome { get; set; }
        public string? ContatoNome { get; set; }
        public DateTime? DataConclusao { get; set; }
        public DateTime? DataEntrega { get; set; }
        public DateTime DataCriacao { get; set; }
        public DateTime? DataAtualizacao { get; set; }
        public DateTime? DataExclusao { get; set; }
        public int QuantidadeComentarios { get; set; }
    }

    public class TarefaSalvarDTO
    {
        public required string Titulo { get; set; }
        public string? Descricao { get; set; }
        public StatusTarefa Status { get; set; } = StatusTarefa.Backlog;
        public PrioridadeTarefa Prioridade { get; set; } = PrioridadeTarefa.Media;
        public int Tipo { get; set; } = 1;
        public int ProjetoId { get; set; }
        public int? SprintId { get; set; }
        public List<int> ResponsavelIds { get; set; } = new();
        public int CriadorId { get; set; }
        public int? AtorId { get; set; }
        public int? ColegioId { get; set; }
        public string? ColegioNome { get; set; }
        public string? ContatoNome { get; set; }
        public DateTime? DataEntrega { get; set; }
    }

    public class TarefaMoverDTO
    {
        public int Id { get; set; }
        public StatusTarefa Status { get; set; }
        public int Ordem { get; set; }
        public int? UsuarioId { get; set; }
    }

    public class TarefaMeuDiaToggleDTO
    {
        public int TarefaId { get; set; }
        public int UsuarioId { get; set; }
    }

    public class TarefaEmMassaDTO
    {
        public List<int> Ids { get; set; } = new();
        public int Valor { get; set; }
        public int? UsuarioId { get; set; }
    }

    public class TarefaExcluirEmMassaDTO
    {
        public List<int> Ids { get; set; } = new();
    }
}
