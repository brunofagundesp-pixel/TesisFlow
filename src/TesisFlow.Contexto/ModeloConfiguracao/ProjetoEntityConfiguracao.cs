using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TesisFlow.Contexto.Conversores;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Contexto.ModeloConfiguracao
{
    public class ProjetoEntityConfiguracao : IEntityTypeConfiguration<Projeto>
    {
        public void Configure(EntityTypeBuilder<Projeto> builder)
        {
            builder.ToTable("Projetos");

            builder.HasKey(p => p.Id);
            builder.Property(p => p.Nome).IsRequired().HasMaxLength(200);
            builder.Property(p => p.Descricao).HasMaxLength(2000);
            builder.Property(p => p.Cor).HasMaxLength(7);
            builder.Property(p => p.Icone).HasMaxLength(50).HasConversion<EmojiValueConverter>();

            builder.HasOne(p => p.Lider)
                .WithMany()
                .HasForeignKey(p => p.LiderId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
