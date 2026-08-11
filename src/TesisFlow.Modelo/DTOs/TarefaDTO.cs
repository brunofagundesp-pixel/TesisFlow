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
        public TipoTarefa Tipo { get; set; }
        public int Ordem { get; set; }
        public int ProjetoId { get; set; }
        public string ProjetoNome { get; set; } = string.Empty;
        public int? SprintId { get; set; }
        public string? SprintNome { get; set; }
        public List<ResponsavelDTO> Responsaveis { get; set; } = new();
        public int CriadorId { get; set; }
        public string CriadorNome { get; set; } = string.Empty;
        public DateTime? DataConclusao { get; set; }
        public DateTime DataCriacao { get; set; }
        public DateTime? DataAtualizacao { get; set; }
        public int QuantidadeComentarios { get; set; }
    }

    public class TarefaSalvarDTO
    {
        public required string Titulo { get; set; }
        public string? Descricao { get; set; }
        public StatusTarefa Status { get; set; } = StatusTarefa.Backlog;
        public PrioridadeTarefa Prioridade { get; set; } = PrioridadeTarefa.Media;
        public TipoTarefa Tipo { get; set; } = TipoTarefa.Tarefa;
        public int ProjetoId { get; set; }
        public int? SprintId { get; set; }
        public List<int> ResponsavelIds { get; set; } = new();
        public int CriadorId { get; set; }
    }

    public class TarefaMoverDTO
    {
        public int Id { get; set; }
        public StatusTarefa Status { get; set; }
        public int Ordem { get; set; }
    }
}
