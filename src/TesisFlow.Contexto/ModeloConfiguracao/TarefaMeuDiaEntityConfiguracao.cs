using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Contexto.ModeloConfiguracao
{
    public class TarefaMeuDiaEntityConfiguracao : IEntityTypeConfiguration<TarefaMeuDia>
    {
        public void Configure(EntityTypeBuilder<TarefaMeuDia> builder)
        {
            builder.ToTable("TarefasMeuDia");

            builder.HasKey(td => td.Id);

            builder.HasOne(td => td.Tarefa)
                .WithMany()
                .HasForeignKey(td => td.TarefaId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(td => td.Usuario)
                .WithMany()
                .HasForeignKey(td => td.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(td => new { td.TarefaId, td.UsuarioId }).IsUnique();
            builder.HasIndex(td => td.UsuarioId);
        }
    }
}
