using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Contexto.ModeloConfiguracao
{
    public class TarefaResponsavelEntityConfiguracao : IEntityTypeConfiguration<TarefaResponsavel>
    {
        public void Configure(EntityTypeBuilder<TarefaResponsavel> builder)
        {
            builder.ToTable("TarefaResponsaveis");

            builder.HasKey(tr => tr.Id);

            builder.HasOne(tr => tr.Tarefa)
                .WithMany(t => t.TarefaResponsaveis)
                .HasForeignKey(tr => tr.TarefaId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(tr => tr.Usuario)
                .WithMany(u => u.TarefaResponsaveis)
                .HasForeignKey(tr => tr.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(tr => new { tr.TarefaId, tr.UsuarioId }).IsUnique();
            builder.HasIndex(tr => tr.UsuarioId);
        }
    }
}
