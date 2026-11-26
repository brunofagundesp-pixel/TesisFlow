using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Contexto.ModeloConfiguracao
{
    public class EscolaCrmHistoricoEntityConfiguracao : IEntityTypeConfiguration<EscolaCrmHistorico>
    {
        public void Configure(EntityTypeBuilder<EscolaCrmHistorico> builder)
        {
            builder.ToTable("EscolasCrmHistorico");

            builder.HasKey(h => h.Id);
            builder.Property(h => h.EscolaCrmId).IsRequired();
            builder.Property(h => h.EtapaAnterior).IsRequired();
            builder.Property(h => h.EtapaNova).IsRequired();
            builder.Property(h => h.UsuarioId).IsRequired();
            builder.Property(h => h.UsuarioNome).HasMaxLength(200);

            builder.HasOne(h => h.EscolaCrm)
                .WithMany()
                .HasForeignKey(h => h.EscolaCrmId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(h => h.EscolaCrmId);
        }
    }
}
