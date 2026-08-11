using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Contexto.ModeloConfiguracao
{
    public class QuadroConfiguracaoEntityConfiguracao : IEntityTypeConfiguration<QuadroConfiguracao>
    {
        public void Configure(EntityTypeBuilder<QuadroConfiguracao> builder)
        {
            builder.ToTable("QuadroConfiguracoes");

            builder.HasKey(q => q.Id);
            builder.Property(q => q.Titulo).IsRequired().HasMaxLength(100);

            builder.HasOne(q => q.Projeto)
                .WithMany()
                .HasForeignKey(q => q.ProjetoId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(q => new { q.ProjetoId, q.Status }).IsUnique();
        }
    }
}
