namespace TesisFlow.Modelo.Entidades
{
    public class EscolaCrmHistorico : EntidadeBase
    {
        public int EscolaCrmId { get; set; }
        public int EtapaAnterior { get; set; }
        public int EtapaNova { get; set; }
        public int UsuarioId { get; set; }
        public string UsuarioNome { get; set; } = string.Empty;

        public EscolaCrm EscolaCrm { get; set; } = null!;
    }
}
