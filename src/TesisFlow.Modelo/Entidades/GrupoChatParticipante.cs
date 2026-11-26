namespace TesisFlow.Modelo.Entidades
{
    public class GrupoChatParticipante : EntidadeBase
    {
        public int GrupoId { get; set; }
        public int UsuarioId { get; set; }

        public GrupoChat Grupo { get; set; } = null!;
        public Usuario Usuario { get; set; } = null!;
    }
}
