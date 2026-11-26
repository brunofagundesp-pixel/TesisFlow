using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Contexto.ModeloConfiguracao
{
    public class MensagemLeituraEntityConfiguracao : IEntityTypeConfiguration<MensagemLeitura>
    {
        public void Configure(EntityTypeBuilder<MensagemLeitura> builder)
        {
            builder.ToTable("MensagemLeituras");
            builder.HasKey(l => l.Id);

            builder.HasOne(l => l.Mensagem)
                .WithMany()
                .HasForeignKey(l => l.MensagemId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(l => l.Usuario)
                .WithMany()
                .HasForeignKey(l => l.UsuarioId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasIndex(l => l.MensagemId);
            builder.HasIndex(l => l.UsuarioId);
            builder.HasIndex(l => new { l.MensagemId, l.UsuarioId }).IsUnique();
        }
    }
}
