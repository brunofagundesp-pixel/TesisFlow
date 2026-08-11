namespace TesisFlow.Modelo.Entidades
{
    public class Usuario : EntidadeBase
    {
        public required string Nome { get; set; }
        public required string Email { get; set; }
        public required string SenhaHash { get; set; }
        public string? Foto { get; set; }
        public string? Cargo { get; set; }

        public ICollection<ProjetoMembro> ProjetosMembro { get; set; } = new List<ProjetoMembro>();
        public ICollection<TarefaResponsavel> TarefaResponsaveis { get; set; } = new List<TarefaResponsavel>();
        public ICollection<Tarefa> TarefasCriadas { get; set; } = new List<Tarefa>();
        public ICollection<Comentario> Comentarios { get; set; } = new List<Comentario>();
    }
}
