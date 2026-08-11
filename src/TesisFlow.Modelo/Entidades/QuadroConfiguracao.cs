using TesisFlow.Modelo.Enums;

namespace TesisFlow.Modelo.Entidades
{
    public class QuadroConfiguracao : EntidadeBase
    {
        public int ProjetoId { get; set; }
        public StatusTarefa Status { get; set; }
        public required string Titulo { get; set; }
        public int Ordem { get; set; }
        public bool Visivel { get; set; } = true;

        public Projeto Projeto { get; set; } = null!;
    }
}
