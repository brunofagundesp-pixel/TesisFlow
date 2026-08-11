using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Contexto.ModeloConfiguracao
{
    public class SprintEntityConfiguracao : IEntityTypeConfiguration<Sprint>
    {
        public void Configure(EntityTypeBuilder<Sprint> builder)
        {
            builder.ToTable("Sprints");

            builder.HasKey(s => s.Id);
            builder.Property(s => s.Nome).IsRequired().HasMaxLength(200);
            builder.Property(s => s.Descricao).HasMaxLength(2000);

            builder.HasOne(s => s.Projeto)
                .WithMany(p => p.Sprints)
                .HasForeignKey(s => s.ProjetoId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(s => s.ProjetoId);
        }
    }
}
