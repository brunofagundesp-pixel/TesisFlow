using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Contexto.ModeloConfiguracao
{
    public class UsuarioEntityConfiguracao : IEntityTypeConfiguration<Usuario>
    {
        public void Configure(EntityTypeBuilder<Usuario> builder)
        {
            builder.ToTable("Usuarios");

            builder.HasKey(u => u.Id);
            builder.Property(u => u.Nome).IsRequired().HasMaxLength(150);
            builder.Property(u => u.Email).IsRequired().HasMaxLength(200);
            builder.Property(u => u.SenhaHash).IsRequired().HasMaxLength(500);
            builder.Property(u => u.Foto).HasMaxLength(1000);
            builder.Property(u => u.Cargo).HasMaxLength(100);

            builder.HasIndex(u => u.Email).IsUnique();
        }
    }
}
