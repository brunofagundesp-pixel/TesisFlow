using Microsoft.EntityFrameworkCore;
using TesisFlow.Contexto.ModeloConfiguracao;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Contexto.Contextos
{
    public class ApplicationDbContextTesisFlow : DbContext
    {
        public ApplicationDbContextTesisFlow(DbContextOptions<ApplicationDbContextTesisFlow> options)
            : base(options)
        {
        }

        public DbSet<Usuario> Usuarios { get; set; } = null!;
        public DbSet<Projeto> Projetos { get; set; } = null!;
        public DbSet<ProjetoMembro> ProjetoMembros { get; set; } = null!;
        public DbSet<Sprint> Sprints { get; set; } = null!;
        public DbSet<Tarefa> Tarefas { get; set; } = null!;
        public DbSet<Categoria> Categorias { get; set; } = null!;
        public DbSet<TarefaResponsavel> TarefaResponsaveis { get; set; } = null!;
        public DbSet<TarefaMeuDia> TarefasMeuDia { get; set; } = null!;
        public DbSet<Anexo> Anexos { get; set; } = null!;
        public DbSet<HistoricoTarefa> HistoricoTarefas { get; set; } = null!;
        public DbSet<ComentarioReacao> ComentarioReacoes { get; set; } = null!;
        public DbSet<Comentario> Comentarios { get; set; } = null!;
        public DbSet<QuadroConfiguracao> QuadroConfiguracoes { get; set; } = null!;
        public DbSet<Notificacao> Notificacoes { get; set; } = null!;
        public DbSet<Mensagem> Mensagens { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.ApplyConfiguration(new UsuarioEntityConfiguracao());
            modelBuilder.ApplyConfiguration(new ProjetoEntityConfiguracao());
            modelBuilder.ApplyConfiguration(new ProjetoMembroEntityConfiguracao());
            modelBuilder.ApplyConfiguration(new SprintEntityConfiguracao());
            modelBuilder.ApplyConfiguration(new TarefaEntityConfiguracao());
            modelBuilder.ApplyConfiguration(new CategoriaEntityConfiguracao());
            modelBuilder.ApplyConfiguration(new ComentarioEntityConfiguracao());
            modelBuilder.ApplyConfiguration(new TarefaResponsavelEntityConfiguracao());
            modelBuilder.ApplyConfiguration(new TarefaMeuDiaEntityConfiguracao());
            modelBuilder.ApplyConfiguration(new AnexoEntityConfiguracao());
            modelBuilder.ApplyConfiguration(new ComentarioReacaoEntityConfiguracao());
            modelBuilder.ApplyConfiguration(new QuadroConfiguracaoEntityConfiguracao());
            modelBuilder.ApplyConfiguration(new NotificacaoEntityConfiguracao());
            modelBuilder.ApplyConfiguration(new MensagemEntityConfiguracao());
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            foreach (var entry in ChangeTracker.Entries<EntidadeBase>())
            {
                if (entry.State == EntityState.Added)
                {
                    entry.Entity.DataCriacao = DateTime.UtcNow;
                }
                else if (entry.State == EntityState.Modified)
                {
                    entry.Entity.DataAtualizacao = DateTime.UtcNow;
                }
            }

            return base.SaveChangesAsync(cancellationToken);
        }
    }
}
