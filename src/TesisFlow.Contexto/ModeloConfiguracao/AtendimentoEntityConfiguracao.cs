using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Contexto.ModeloConfiguracao
{
    public class AtendimentoEntityConfiguracao : IEntityTypeConfiguration<Atendimento>
    {
        public void Configure(EntityTypeBuilder<Atendimento> builder)
        {
            builder.ToTable("Atendimentos");

            builder.HasKey(a => a.Id);
            builder.Property(a => a.ColegioId).IsRequired();
            builder.Property(a => a.ColegioNome).HasMaxLength(300);
            builder.Property(a => a.Titulo).IsRequired().HasMaxLength(300);
            builder.Property(a => a.Descricao).HasColumnType("TEXT");
            builder.Property(a => a.Status).IsRequired();
            builder.Property(a => a.NomeContato).HasMaxLength(200);
            builder.Property(a => a.UsuarioId).IsRequired();
            builder.Property(a => a.UsuarioNome).HasMaxLength(200);
            builder.Property(a => a.ProximoContatoHora).HasMaxLength(10);
            builder.Property(a => a.ProximoContatoMotivo).HasMaxLength(300);
            builder.Property(a => a.AtendimentoOrigemId);

            builder.HasIndex(a => a.ColegioId);
            builder.HasIndex(a => a.Status);
            builder.HasIndex(a => a.ProximoContatoData);
        }
    }
}
