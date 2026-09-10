using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TesisFlow.Contexto.Contextos;
using TesisFlow.Core.Interfaces;
using TesisFlow.DI;
using TesisFlow.Api.Hubs;
using TesisFlow.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSignalR();

var jwtKey = builder.Configuration["Jwt:Key"]!;
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.Zero,
            NameClaimType = "name",
            RoleClaimType = "role"
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"].ToString();
                if (string.IsNullOrEmpty(accessToken))
                {
                    accessToken = context.Request.Query["token"].ToString();
                }
                if (!string.IsNullOrEmpty(accessToken))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorizationBuilder()
    .SetFallbackPolicy(new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build());

builder.Services.AddHostedService<TarefaLixeiraLimpezaService>();
builder.Services.AddHostedService<NotificacaoLimpezaService>();
builder.Services.AddHostedService<TarefaLembreteService>();

builder.Services.AddScoped<INotificacaoDispatcher, NotificacaoDispatcher>();
builder.Services.AddScoped<TokenServico>();

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
app.UseAuthentication();
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
        await GarantirTabelaColegioNotasAsync(db);
        await GarantirColunaAsync(db, "ColegioNotas", "Cor", "VARCHAR(20) NOT NULL DEFAULT ''");
        await GarantirColunaAsync(db, "ColegioNotas", "Fixa", "TINYINT(1) NOT NULL DEFAULT 0");
        await GarantirColunaAsync(db, "ColegioNotas", "ParceiroId", "INT NULL");
        await GarantirColunaAsync(db, "ColegioNotas", "DataFixacao", "DATETIME NULL");
        await GarantirIndiceColegioNotasAsync(db);
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

static async Task GarantirTabelaColegioNotasAsync(ApplicationDbContextTesisFlow db)
{
    await db.Database.ExecuteSqlRawAsync(
        "CREATE TABLE IF NOT EXISTS `ColegioNotas` (" +
        "`Id` INT NOT NULL AUTO_INCREMENT, " +
        "`ColegioId` INT NOT NULL, " +
        "`Titulo` VARCHAR(200) NOT NULL DEFAULT '', " +
        "`Conteudo` TEXT NULL, " +
        "`Cor` VARCHAR(20) NOT NULL DEFAULT '', " +
        "`Fixa` TINYINT(1) NOT NULL DEFAULT 0, " +
        "`ParceiroId` INT NULL, " +
        "`DataFixacao` DATETIME NULL, " +
        "`DataCriacao` DATETIME NOT NULL, " +
        "`DataAtualizacao` DATETIME NULL, " +
        "`Ativo` TINYINT(1) NOT NULL DEFAULT 1, " +
        "PRIMARY KEY (`Id`), " +
        "INDEX `IX_ColegioNotas_ColegioId` (`ColegioId`)" +
        ") ENGINE=InnoDB");
}

static async Task GarantirIndiceColegioNotasAsync(ApplicationDbContextTesisFlow db)
{
    var unico = await db.Database
        .SqlQueryRaw<int>(
            "SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = {0} AND INDEX_NAME = {1} AND NON_UNIQUE = 0",
            "ColegioNotas", "IX_ColegioNotas_ColegioId")
        .FirstOrDefaultAsync();

    if (unico > 0)
    {
        await db.Database.ExecuteSqlRawAsync("ALTER TABLE `ColegioNotas` DROP INDEX `IX_ColegioNotas_ColegioId`");
    }

    var existe = await db.Database
        .SqlQueryRaw<int>(
            "SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = {0} AND INDEX_NAME = {1}",
            "ColegioNotas", "IX_ColegioNotas_ColegioId")
        .FirstOrDefaultAsync();

    if (existe == 0)
    {
        await db.Database.ExecuteSqlRawAsync("CREATE INDEX `IX_ColegioNotas_ColegioId` ON `ColegioNotas` (`ColegioId`)");
    }
}
