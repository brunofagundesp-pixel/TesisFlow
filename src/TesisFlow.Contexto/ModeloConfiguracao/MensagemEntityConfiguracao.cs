using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Contexto.ModeloConfiguracao
{
    public class MensagemEntityConfiguracao : IEntityTypeConfiguration<Mensagem>
    {
        public void Configure(EntityTypeBuilder<Mensagem> builder)
        {
            builder.ToTable("Mensagens");
            builder.HasKey(m => m.Id);
            builder.Property(m => m.Texto).IsRequired().HasMaxLength(5000);
            builder.Property(m => m.Lida).HasDefaultValue(false);
            builder.Property(m => m.Entregue).HasDefaultValue(false);

            builder.HasOne(m => m.Remetente)
                .WithMany()
                .HasForeignKey(m => m.RemetenteId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(m => m.Destinatario)
                .WithMany()
                .HasForeignKey(m => m.DestinatarioId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasIndex(m => m.DestinatarioId);
            builder.HasIndex(m => new { m.DestinatarioId, m.DataCriacao });
        }
    }
}
