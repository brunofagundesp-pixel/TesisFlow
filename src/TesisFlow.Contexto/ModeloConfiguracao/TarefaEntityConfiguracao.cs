using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Contexto.ModeloConfiguracao
{
    public class TarefaEntityConfiguracao : IEntityTypeConfiguration<Tarefa>
    {
        public void Configure(EntityTypeBuilder<Tarefa> builder)
        {
            builder.ToTable("Tarefas");

            builder.HasKey(t => t.Id);
            builder.Property(t => t.Titulo).IsRequired().HasMaxLength(300);
            builder.Property(t => t.Descricao).HasMaxLength(5000);
            builder.Property(t => t.Status).IsRequired();
            builder.Property(t => t.Prioridade).IsRequired();
            builder.Property(t => t.CategoriaId).HasColumnName("Tipo").IsRequired();
            builder.Property(t => t.ColegioNome).HasMaxLength(300);
            builder.Property(t => t.ContatoNome).HasMaxLength(200);
            builder.Property(t => t.ContatoId);
            builder.Property(t => t.DataExclusao);
            builder.Property(t => t.DataEntrega);
            builder.Property(t => t.LembreteNivel).HasDefaultValue(0);

            builder.HasOne(t => t.Projeto)
                .WithMany(p => p.Tarefas)
                .HasForeignKey(t => t.ProjetoId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(t => t.Sprint)
                .WithMany(s => s.Tarefas)
                .HasForeignKey(t => t.SprintId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(t => t.Categoria)
                .WithMany(c => c.Tarefas)
                .HasForeignKey(t => t.CategoriaId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(t => t.Criador)
                .WithMany(u => u.TarefasCriadas)
                .HasForeignKey(t => t.CriadorId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasIndex(t => new { t.ProjetoId, t.Status, t.Ordem });
            builder.HasIndex(t => t.SprintId);
            builder.HasIndex(t => t.CriadorId);
            builder.HasIndex(t => t.CategoriaId);
            builder.HasIndex(t => t.DataEntrega);
        }
    }
}
