using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Contexto.ModeloConfiguracao
{
    public class ProjetoMembroEntityConfiguracao : IEntityTypeConfiguration<ProjetoMembro>
    {
        public void Configure(EntityTypeBuilder<ProjetoMembro> builder)
        {
            builder.ToTable("ProjetoMembros");

            builder.HasKey(pm => pm.Id);

            builder.HasOne(pm => pm.Projeto)
                .WithMany(p => p.Membros)
                .HasForeignKey(pm => pm.ProjetoId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(pm => pm.Usuario)
                .WithMany(u => u.ProjetosMembro)
                .HasForeignKey(pm => pm.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(pm => new { pm.ProjetoId, pm.UsuarioId }).IsUnique();
        }
    }
}
