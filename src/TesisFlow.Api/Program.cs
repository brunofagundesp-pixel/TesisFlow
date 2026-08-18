using Microsoft.EntityFrameworkCore;
using TesisFlow.Contexto.Contextos;
using TesisFlow.Core.Interfaces;
using TesisFlow.DI;
using TesisFlow.Api.Hubs;
using TesisFlow.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSignalR();

builder.Services.AddHostedService<TarefaLixeiraLimpezaService>();
builder.Services.AddHostedService<NotificacaoLimpezaService>();
builder.Services.AddHostedService<TarefaLembreteService>();

builder.Services.AddScoped<INotificacaoDispatcher, NotificacaoDispatcher>();

var connectionString = builder.Configuration.GetConnectionString("TesisFlowDB")!;
var serverVersion = ServerVersion.AutoDetect(connectionString);

builder.Services.AddDbContext<ApplicationDbContextTesisFlow>(options =>
{
    options.UseMySql(connectionString, serverVersion, mysql =>
    {
        mysql.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(10),
            errorNumbersToAdd: null);
    });
});

var tesisCcBaseUrl = builder.Configuration["TesisCc:BaseUrl"]!;
builder.Services.AddHttpClient("TesisCc", client =>
{
    client.BaseAddress = new Uri(tesisCcBaseUrl);
});

Bootstrap.ConfigureServices(builder.Services);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins("http://localhost:4200", "https://localhost:4200", "http://192.168.15.3:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseCors("AllowAngular");
app.UseRouting();
app.UseAuthorization();
app.MapControllers();
app.MapHub<NotificacaoHub>("/hubs/notificacoes");
app.MapHub<ChatHub>("/hubs/chat");
app.MapHub<CallHub>("/hubs/chamadas");

await AplicarMigracoesAsync(app);

app.Run();

static async Task AplicarMigracoesAsync(WebApplication app)
{
    try
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContextTesisFlow>();

        await GarantirColunaAsync(db, "Mensagens", "Entregue", "TINYINT(1) NOT NULL DEFAULT 0");
        await GarantirColunaAsync(db, "Mensagens", "Audio", "VARCHAR(500) NULL");
        await GarantirColunaAsync(db, "Mensagens", "AudioDuracao", "INT NULL");
        await GarantirColunaAsync(db, "Mensagens", "MensagemRespondidaId", "INT NULL");
        await GarantirColunaAsync(db, "Mensagens", "VinculoTipo", "VARCHAR(20) NULL");
        await GarantirColunaAsync(db, "Mensagens", "VinculoId", "INT NULL");
        await GarantirColunaAsync(db, "Mensagens", "VinculoTitulo", "VARCHAR(300) NULL");
        await GarantirColunaAsync(db, "Mensagens", "VinculoSubtitulo", "VARCHAR(300) NULL");
        await GarantirColunaAsync(db, "Mensagens", "VinculoLink", "VARCHAR(500) NULL");
        await GarantirColunaAsync(db, "Mensagens", "VinculoIcone", "VARCHAR(50) NULL");
        await GarantirColunaAsync(db, "Mensagens", "Imagem", "VARCHAR(500) NULL");
        await GarantirColunaAsync(db, "Mensagens", "ImagemNome", "VARCHAR(255) NULL");
        await GarantirColunaAsync(db, "Tarefas", "DataEntrega", "DATETIME NULL");
        await GarantirColunaAsync(db, "Tarefas", "LembreteNivel", "INT NOT NULL DEFAULT 0");
        await GarantirColunaAsync(db, "Notificacoes", "TarefaId", "INT NULL");
        await GarantirColunaAsync(db, "Notificacoes", "ProjetoId", "INT NULL");
        await GarantirColunaAsync(db, "Projetos", "Cor", "VARCHAR(7) NULL");
        await GarantirColunaAsync(db, "Projetos", "Icone", "VARCHAR(50) NULL");
        await GarantirTamanhoColunaAsync(db, "Projetos", "Icone", 50, "VARCHAR(50) NULL");
        await GarantirColunaAsync(db, "ProjetoMembros", "Status", "INT NOT NULL DEFAULT 2");
    }
    catch (Exception ex)
    {
        var logger = app.Services.GetRequiredService<ILoggerFactory>().CreateLogger("DatabaseMigrator");
        logger.LogError(ex, "Erro ao aplicar migrações automáticas");
    }
}

static async Task GarantirColunaAsync(ApplicationDbContextTesisFlow db, string tabela, string coluna, string definicao)
{
    var existe = await db.Database
        .SqlQueryRaw<int>(
            "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = {0} AND COLUMN_NAME = {1}",
            tabela, coluna)
        .FirstOrDefaultAsync();

    if (existe == 0)
    {
        await db.Database.ExecuteSqlRawAsync($"ALTER TABLE `{tabela}` ADD COLUMN `{coluna}` {definicao}");
    }
}

static async Task GarantirTamanhoColunaAsync(ApplicationDbContextTesisFlow db, string tabela, string coluna, int tamanhoMinimo, string definicao)
{
    var tamanhoAtual = await db.Database
        .SqlQueryRaw<int>(
            "SELECT COALESCE(CHARACTER_MAXIMUM_LENGTH, 0) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = {0} AND COLUMN_NAME = {1}",
            tabela, coluna)
        .FirstOrDefaultAsync();

    if (tamanhoAtual < tamanhoMinimo)
    {
        await db.Database.ExecuteSqlRawAsync($"ALTER TABLE `{tabela}` MODIFY COLUMN `{coluna}` {definicao}");
    }
}
