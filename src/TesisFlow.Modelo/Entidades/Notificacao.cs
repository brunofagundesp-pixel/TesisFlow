namespace TesisFlow.Modelo.Entidades
{
    public class Notificacao : EntidadeBase
    {
        public required string Titulo { get; set; }
        public string? Descricao { get; set; }
        public required string Tipo { get; set; }
        public string? Link { get; set; }
        public bool Lida { get; set; }
        public int? TargetUserId { get; set; }
    }
}
