using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Contexto.ModeloConfiguracao
{
    public class ContatoEntityConfiguracao : IEntityTypeConfiguration<Contato>
    {
        public void Configure(EntityTypeBuilder<Contato> builder)
        {
            builder.ToTable("Contatos");

            builder.HasKey(c => c.Id);
            builder.Property(c => c.ColegioId).IsRequired();
            builder.Property(c => c.Nome).IsRequired().HasMaxLength(200);
            builder.Property(c => c.Telefone).HasMaxLength(50);
            builder.Property(c => c.Email).HasMaxLength(200);
            builder.Property(c => c.Cargo).HasMaxLength(100);

            builder.HasIndex(c => c.ColegioId);
        }
    }
}
