using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Contexto.ModeloConfiguracao
{
    public class AnexoEntityConfiguracao : IEntityTypeConfiguration<Anexo>
    {
        public void Configure(EntityTypeBuilder<Anexo> builder)
        {
            builder.ToTable("Anexos");
            builder.HasKey(a => a.Id);
            builder.Property(a => a.NomeArquivo).IsRequired().HasMaxLength(500);
            builder.Property(a => a.Caminho).IsRequired().HasMaxLength(1000);
            builder.Property(a => a.Tipo).HasMaxLength(100);

            builder.HasOne(a => a.Tarefa)
                .WithMany()
                .HasForeignKey(a => a.TarefaId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(a => a.TarefaId);
        }
    }
}
