namespace TesisFlow.Modelo.Entidades
{
    public class GrupoChat : EntidadeBase
    {
        public int CriadorId { get; set; }
        public required string Nome { get; set; }

        public Usuario Criador { get; set; } = null!;
        public ICollection<GrupoChatParticipante> Participantes { get; set; } = new List<GrupoChatParticipante>();
        public ICollection<Mensagem> Mensagens { get; set; } = new List<Mensagem>();
    }
}
