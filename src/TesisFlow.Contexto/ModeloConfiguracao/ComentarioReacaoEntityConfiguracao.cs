using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Contexto.ModeloConfiguracao
{
    public class ComentarioReacaoEntityConfiguracao : IEntityTypeConfiguration<ComentarioReacao>
    {
        public void Configure(EntityTypeBuilder<ComentarioReacao> builder)
        {
            builder.ToTable("ComentarioReacoes");
            builder.HasKey(r => r.Id);
            builder.Property(r => r.Emoji).IsRequired().HasMaxLength(10);

            builder.HasOne(r => r.Comentario)
                .WithMany()
                .HasForeignKey(r => r.ComentarioId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(r => new { r.ComentarioId, r.UsuarioId }).IsUnique();
        }
    }
}
