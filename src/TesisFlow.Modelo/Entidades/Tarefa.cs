using TesisFlow.Modelo.Enums;

namespace TesisFlow.Modelo.Entidades
{
    public class Tarefa : EntidadeBase
    {
        public required string Titulo { get; set; }
        public string? Chave { get; set; }
        public string? Descricao { get; set; }
        public StatusTarefa Status { get; set; } = StatusTarefa.Backlog;
        public PrioridadeTarefa Prioridade { get; set; } = PrioridadeTarefa.Media;
        public TipoTarefa Tipo { get; set; } = TipoTarefa.Tarefa;
        public int Ordem { get; set; }
        public int ProjetoId { get; set; }
        public int? SprintId { get; set; }
        public int CriadorId { get; set; }
        public DateTime? DataConclusao { get; set; }

        public Projeto Projeto { get; set; } = null!;
        public Sprint? Sprint { get; set; }
        public Usuario Criador { get; set; } = null!;
        public ICollection<Comentario> Comentarios { get; set; } = new List<Comentario>();
        public ICollection<TarefaResponsavel> TarefaResponsaveis { get; set; } = new List<TarefaResponsavel>();
    }
}
