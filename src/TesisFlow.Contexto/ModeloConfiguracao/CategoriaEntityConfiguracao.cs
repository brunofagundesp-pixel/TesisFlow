using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Contexto.ModeloConfiguracao
{
    public class CategoriaEntityConfiguracao : IEntityTypeConfiguration<Categoria>
    {
        public void Configure(EntityTypeBuilder<Categoria> builder)
        {
            builder.ToTable("Categorias");

            builder.HasKey(c => c.Id);
            builder.Property(c => c.Nome).IsRequired().HasMaxLength(100);
            builder.Property(c => c.Icone).HasMaxLength(50);
            builder.Property(c => c.Cor).HasMaxLength(20);

            builder.HasOne(c => c.Projeto)
                .WithMany(p => p.Categorias)
                .HasForeignKey(c => c.ProjetoId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(c => c.ProjetoId);
        }
    }
}
