namespace TesisFlow.Modelo.DTOs
{
    public class CategoriaDTO
    {
        public int Id { get; set; }
        public int ProjetoId { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string Icone { get; set; } = string.Empty;
        public string Cor { get; set; } = string.Empty;
        public int QuantidadeTarefas { get; set; }
        public bool Ativo { get; set; }
    }

    public class CategoriaSalvarDTO
    {
        public required string Nome { get; set; }
        public required string Icone { get; set; }
        public string Cor { get; set; } = "#3d81f4";
        public int ProjetoId { get; set; }
    }

    public class ExcluirCategoriaDTO
    {
        public int? NovaCategoriaId { get; set; }
    }
}
