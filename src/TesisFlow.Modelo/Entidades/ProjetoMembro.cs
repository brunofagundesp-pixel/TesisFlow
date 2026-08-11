using TesisFlow.Modelo.Enums;

namespace TesisFlow.Modelo.Entidades
{
    public class ProjetoMembro : EntidadeBase
    {
        public int ProjetoId { get; set; }
        public int UsuarioId { get; set; }
        public PapelProjeto Papel { get; set; } = PapelProjeto.Membro;

        public Projeto Projeto { get; set; } = null!;
        public Usuario Usuario { get; set; } = null!;
    }
}
