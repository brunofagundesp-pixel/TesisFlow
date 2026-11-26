namespace TesisFlow.Modelo.Entidades
{
    public class MensagemLeitura : EntidadeBase
    {
        public int MensagemId { get; set; }
        public int UsuarioId { get; set; }

        public Mensagem Mensagem { get; set; } = null!;
        public Usuario Usuario { get; set; } = null!;
    }
}
