using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Contexto.ModeloConfiguracao
{
    public class GrupoChatEntityConfiguracao : IEntityTypeConfiguration<GrupoChat>
    {
        public void Configure(EntityTypeBuilder<GrupoChat> builder)
        {
            builder.ToTable("GrupoChats");
            builder.HasKey(g => g.Id);
            builder.Property(g => g.Nome).IsRequired().HasMaxLength(300);

            builder.HasOne(g => g.Criador)
                .WithMany()
                .HasForeignKey(g => g.CriadorId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
