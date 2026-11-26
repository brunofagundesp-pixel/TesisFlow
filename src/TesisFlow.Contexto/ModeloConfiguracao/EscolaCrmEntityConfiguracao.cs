using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Contexto.ModeloConfiguracao
{
    public class EscolaCrmEntityConfiguracao : IEntityTypeConfiguration<EscolaCrm>
    {
        public void Configure(EntityTypeBuilder<EscolaCrm> builder)
        {
            builder.ToTable("EscolasCrm");

            builder.HasKey(e => e.Id);
            builder.Property(e => e.ColegioId).IsRequired();
            builder.Property(e => e.ColegioNome).HasMaxLength(300);
            builder.Property(e => e.EtapaComercial).IsRequired();
            builder.Property(e => e.ResponsavelNome).HasMaxLength(200);
            builder.Property(e => e.ContatoPrincipalNome).HasMaxLength(200);
            builder.Property(e => e.MotivoEncerramento).HasMaxLength(300);
            builder.Property(e => e.MotivoObservacao).HasMaxLength(500);

            builder.HasIndex(e => e.ColegioId).IsUnique();
            builder.HasIndex(e => e.EtapaComercial);
        }
    }
}
