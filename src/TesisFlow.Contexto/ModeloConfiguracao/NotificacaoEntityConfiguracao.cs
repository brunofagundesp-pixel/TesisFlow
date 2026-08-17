using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Contexto.ModeloConfiguracao
{
    public class NotificacaoEntityConfiguracao : IEntityTypeConfiguration<Notificacao>
    {
        public void Configure(EntityTypeBuilder<Notificacao> builder)
        {
            builder.ToTable("Notificacoes");
            builder.HasKey(n => n.Id);
            builder.Property(n => n.Titulo).IsRequired().HasMaxLength(300);
            builder.Property(n => n.Descricao).HasMaxLength(1000);
            builder.Property(n => n.Tipo).IsRequired().HasMaxLength(50);
            builder.Property(n => n.Link).HasMaxLength(500);
            builder.Property(n => n.TarefaId);
            builder.Property(n => n.ProjetoId);

            builder.HasIndex(n => n.TargetUserId);
            builder.HasIndex(n => n.TarefaId);
            builder.HasIndex(n => n.ProjetoId);
        }
    }
}
