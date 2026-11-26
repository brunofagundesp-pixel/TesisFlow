using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Contexto.ModeloConfiguracao
{
    public class GrupoChatParticipanteEntityConfiguracao : IEntityTypeConfiguration<GrupoChatParticipante>
    {
        public void Configure(EntityTypeBuilder<GrupoChatParticipante> builder)
        {
            builder.ToTable("GrupoChatParticipantes");
            builder.HasKey(p => p.Id);

            builder.HasOne(p => p.Grupo)
                .WithMany(g => g.Participantes)
                .HasForeignKey(p => p.GrupoId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(p => p.Usuario)
                .WithMany()
                .HasForeignKey(p => p.UsuarioId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasIndex(p => p.GrupoId);
            builder.HasIndex(p => p.UsuarioId);
            builder.HasIndex(p => new { p.GrupoId, p.UsuarioId }).IsUnique();
        }
    }
}
