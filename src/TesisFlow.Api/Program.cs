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
    options.UseMySql(connectionString, serverVersion);
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
        await GarantirColunaAsync(db, "Tarefas", "DataEntrega", "DATETIME NULL");
        await GarantirColunaAsync(db, "Tarefas", "LembreteNivel", "INT NOT NULL DEFAULT 0");
        await GarantirColunaAsync(db, "Notificacoes", "TarefaId", "INT NULL");
        await GarantirColunaAsync(db, "Notificacoes", "ProjetoId", "INT NULL");
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
