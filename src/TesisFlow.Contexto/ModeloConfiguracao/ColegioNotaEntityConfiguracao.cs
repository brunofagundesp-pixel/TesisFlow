using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Contexto.ModeloConfiguracao
{
    public class ColegioNotaEntityConfiguracao : IEntityTypeConfiguration<ColegioNota>
    {
        public void Configure(EntityTypeBuilder<ColegioNota> builder)
        {
            builder.ToTable("ColegioNotas");

            builder.HasKey(c => c.Id);
            builder.Property(c => c.ColegioId).IsRequired();
            builder.Property(c => c.Titulo).IsRequired().HasMaxLength(200);
            builder.Property(c => c.Conteudo).HasColumnType("TEXT");
            builder.Property(c => c.Cor).HasMaxLength(20);
            builder.Property(c => c.Fixa).IsRequired();
            builder.Property(c => c.ParceiroId).IsRequired(false);

            builder.HasIndex(c => c.ColegioId);
            builder.HasIndex(c => c.ParceiroId);
        }
    }
}
