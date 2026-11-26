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
            builder.Property(m => m.Audio).HasMaxLength(500);
            builder.Property(m => m.AudioDuracao);
            builder.Property(m => m.VinculoTipo).HasMaxLength(20);
            builder.Property(m => m.VinculoId);
            builder.Property(m => m.VinculoTitulo).HasMaxLength(300);
            builder.Property(m => m.VinculoSubtitulo).HasMaxLength(300);
            builder.Property(m => m.VinculoLink).HasMaxLength(500);
            builder.Property(m => m.VinculoIcone).HasMaxLength(50);
            builder.Property(m => m.Imagem).HasMaxLength(500);
            builder.Property(m => m.ImagemNome).HasMaxLength(255);

            builder.HasOne(m => m.Remetente)
                .WithMany()
                .HasForeignKey(m => m.RemetenteId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(m => m.Destinatario)
                .WithMany()
                .HasForeignKey(m => m.DestinatarioId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(m => m.Grupo)
                .WithMany(g => g.Mensagens)
                .HasForeignKey(m => m.GrupoId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(m => m.MensagemRespondida)
                .WithMany()
                .HasForeignKey(m => m.MensagemRespondidaId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasIndex(m => m.DestinatarioId);
            builder.HasIndex(m => new { m.DestinatarioId, m.DataCriacao });
            builder.HasIndex(m => m.GrupoId);
            builder.HasIndex(m => new { m.GrupoId, m.DataCriacao });
            builder.HasIndex(m => m.MensagemRespondidaId);
        }
    }
}
