using System.Data;
using System.Data.Common;
using System.Security.Claims;
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
            RoleClaimType = ClaimTypes.Role
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
builder.Services.AddHostedService<RetornoLembreteService>();

builder.Services.AddScoped<INotificacaoDispatcher, NotificacaoDispatcher>();
builder.Services.AddScoped<TokenServico>();
builder.Services.AddSingleton<CaminhosService>();

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
        var logger = app.Services.GetRequiredService<ILoggerFactory>().CreateLogger("DatabaseMigrator");

        await MigrarGrupoChatAsync(db, logger);
        await MigrarAtendimentosAsync(db, logger);
        await MigrarCrmAsync(db, logger);

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
        await GarantirColunaAsync(db, "Usuarios", "TesisCcSid", "VARCHAR(50) NULL");
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

static async Task MigrarGrupoChatAsync(ApplicationDbContextTesisFlow db, ILogger logger)
{
    try
    {
        await GarantirTabelaGrupoChatAsync(db);
        await GarantirColunaAsync(db, "Mensagens", "GrupoId", "INT NULL");
        await GarantirDestinatarioNullableAsync(db);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Erro ao aplicar migração do grupo de chat");
    }
}

static async Task MigrarAtendimentosAsync(ApplicationDbContextTesisFlow db, ILogger logger)
{
    try
    {
        await GarantirTabelaAtendimentosAsync(db);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Erro ao aplicar migração de atendimentos (CRM)");
    }
}

static async Task MigrarCrmAsync(ApplicationDbContextTesisFlow db, ILogger logger)
{
    try
    {
        await GarantirTabelaContatosAsync(db);
        await GarantirTabelaEscolasCrmAsync(db);
        await GarantirTabelaEscolasCrmHistoricoAsync(db);

        await GarantirColunaAsync(db, "Atendimentos", "TipoInteracao", "INT NULL");
        await GarantirColunaAsync(db, "Atendimentos", "Canal", "INT NULL");
        await GarantirColunaAsync(db, "Atendimentos", "Resultado", "INT NULL");
        await GarantirColunaAsync(db, "Atendimentos", "ContatoId", "INT NULL");
        await GarantirColunaAsync(db, "Atendimentos", "AtendimentoOrigemId", "INT NULL");
        await GarantirColunaAsync(db, "Atendimentos", "ProximoContatoData", "DATETIME NULL");
        await GarantirColunaAsync(db, "Atendimentos", "ProximoContatoHora", "VARCHAR(10) NULL");
        await GarantirColunaAsync(db, "Atendimentos", "ProximoContatoMotivo", "VARCHAR(300) NULL");
        await GarantirColunaAsync(db, "Atendimentos", "RetornoConcluido", "TINYINT(1) NOT NULL DEFAULT 0");
        await GarantirColunaAsync(db, "Atendimentos", "LembreteNivel", "INT NOT NULL DEFAULT 0");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Erro ao aplicar migração do CRM");
    }
}

static async Task<object?> ObterEscalarAsync(ApplicationDbContextTesisFlow db, string sql, params (string Nome, object Valor)[] parametros)
{
    var connection = db.Database.GetDbConnection();
    var abrir = connection.State != ConnectionState.Open;
    if (abrir) await connection.OpenAsync();

    try
    {
        await using var cmd = connection.CreateCommand();
        cmd.CommandText = sql;

        foreach (var (nome, valor) in parametros)
        {
            var p = cmd.CreateParameter();
            p.ParameterName = nome;
            p.Value = valor;
            cmd.Parameters.Add(p);
        }

        return await cmd.ExecuteScalarAsync();
    }
    finally
    {
        if (abrir) await connection.CloseAsync();
    }
}

static async Task GarantirColunaAsync(ApplicationDbContextTesisFlow db, string tabela, string coluna, string definicao)
{
    var existe = Convert.ToInt64(await ObterEscalarAsync(db,
        "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tabela AND COLUMN_NAME = @coluna",
        ("@tabela", tabela), ("@coluna", coluna)));

    if (existe == 0)
    {
        await db.Database.ExecuteSqlRawAsync($"ALTER TABLE `{tabela}` ADD COLUMN `{coluna}` {definicao}");
    }
}

static async Task GarantirTamanhoColunaAsync(ApplicationDbContextTesisFlow db, string tabela, string coluna, int tamanhoMinimo, string definicao)
{
    var tamanhoAtual = Convert.ToInt64(await ObterEscalarAsync(db,
        "SELECT COALESCE(CHARACTER_MAXIMUM_LENGTH, 0) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tabela AND COLUMN_NAME = @coluna",
        ("@tabela", tabela), ("@coluna", coluna)));

    if (tamanhoAtual < tamanhoMinimo)
    {
        await db.Database.ExecuteSqlRawAsync($"ALTER TABLE `{tabela}` MODIFY COLUMN `{coluna}` {definicao}");
    }
}

static async Task GarantirDestinatarioNullableAsync(ApplicationDbContextTesisFlow db)
{
    var isNullable = (await ObterEscalarAsync(db,
        "SELECT IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Mensagens' AND COLUMN_NAME = 'DestinatarioId'")) as string;

    if (isNullable == "YES")
        return;

    var fk = (await ObterEscalarAsync(db,
        "SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Mensagens' AND COLUMN_NAME = 'DestinatarioId' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1")) as string;

    if (!string.IsNullOrEmpty(fk))
        await db.Database.ExecuteSqlRawAsync($"ALTER TABLE `Mensagens` DROP FOREIGN KEY `{fk}`");

    await db.Database.ExecuteSqlRawAsync("ALTER TABLE `Mensagens` MODIFY COLUMN `DestinatarioId` INT NULL");

    if (!string.IsNullOrEmpty(fk))
        await db.Database.ExecuteSqlRawAsync($"ALTER TABLE `Mensagens` ADD CONSTRAINT `{fk}` FOREIGN KEY (`DestinatarioId`) REFERENCES `Usuarios`(`Id`) ON DELETE RESTRICT");
}

static async Task GarantirTabelaGrupoChatAsync(ApplicationDbContextTesisFlow db)
{
    await db.Database.ExecuteSqlRawAsync(
        "CREATE TABLE IF NOT EXISTS `GrupoChats` (" +
        "`Id` INT NOT NULL AUTO_INCREMENT, " +
        "`CriadorId` INT NOT NULL, " +
        "`Nome` VARCHAR(300) NOT NULL DEFAULT '', " +
        "`DataCriacao` DATETIME NOT NULL, " +
        "`DataAtualizacao` DATETIME NULL, " +
        "`Ativo` TINYINT(1) NOT NULL DEFAULT 1, " +
        "PRIMARY KEY (`Id`), " +
        "INDEX `IX_GrupoChats_CriadorId` (`CriadorId`)" +
        ") ENGINE=InnoDB");

    await db.Database.ExecuteSqlRawAsync(
        "CREATE TABLE IF NOT EXISTS `GrupoChatParticipantes` (" +
        "`Id` INT NOT NULL AUTO_INCREMENT, " +
        "`GrupoId` INT NOT NULL, " +
        "`UsuarioId` INT NOT NULL, " +
        "`DataCriacao` DATETIME NOT NULL, " +
        "`DataAtualizacao` DATETIME NULL, " +
        "`Ativo` TINYINT(1) NOT NULL DEFAULT 1, " +
        "PRIMARY KEY (`Id`), " +
        "INDEX `IX_GrupoChatParticipantes_GrupoId` (`GrupoId`), " +
        "INDEX `IX_GrupoChatParticipantes_UsuarioId` (`UsuarioId`), " +
        "UNIQUE INDEX `IX_GrupoChatParticipantes_GrupoUsuario` (`GrupoId`, `UsuarioId`)" +
        ") ENGINE=InnoDB");

    await db.Database.ExecuteSqlRawAsync(
        "CREATE TABLE IF NOT EXISTS `MensagemLeituras` (" +
        "`Id` INT NOT NULL AUTO_INCREMENT, " +
        "`MensagemId` INT NOT NULL, " +
        "`UsuarioId` INT NOT NULL, " +
        "`DataCriacao` DATETIME NOT NULL, " +
        "`DataAtualizacao` DATETIME NULL, " +
        "`Ativo` TINYINT(1) NOT NULL DEFAULT 1, " +
        "PRIMARY KEY (`Id`), " +
        "INDEX `IX_MensagemLeituras_MensagemId` (`MensagemId`), " +
        "INDEX `IX_MensagemLeituras_UsuarioId` (`UsuarioId`), " +
        "UNIQUE INDEX `IX_MensagemLeituras_MensagemUsuario` (`MensagemId`, `UsuarioId`)" +
        ") ENGINE=InnoDB");
}

static async Task GarantirTabelaAtendimentosAsync(ApplicationDbContextTesisFlow db)
{
    await db.Database.ExecuteSqlRawAsync(
        "CREATE TABLE IF NOT EXISTS `Atendimentos` (" +
        "`Id` INT NOT NULL AUTO_INCREMENT, " +
        "`ColegioId` INT NOT NULL, " +
        "`ColegioNome` VARCHAR(300) NOT NULL DEFAULT '', " +
        "`Titulo` VARCHAR(300) NOT NULL DEFAULT '', " +
        "`Descricao` TEXT NULL, " +
        "`Status` INT NOT NULL DEFAULT 0, " +
        "`NomeContato` VARCHAR(200) NULL, " +
        "`UsuarioId` INT NOT NULL DEFAULT 0, " +
        "`UsuarioNome` VARCHAR(200) NOT NULL DEFAULT '', " +
        "`DataCriacao` DATETIME NOT NULL, " +
        "`DataAtualizacao` DATETIME NULL, " +
        "`Ativo` TINYINT(1) NOT NULL DEFAULT 1, " +
        "PRIMARY KEY (`Id`), " +
        "INDEX `IX_Atendimentos_ColegioId` (`ColegioId`), " +
        "INDEX `IX_Atendimentos_Status` (`Status`)" +
        ") ENGINE=InnoDB");
}

static async Task GarantirTabelaContatosAsync(ApplicationDbContextTesisFlow db)
{
    await db.Database.ExecuteSqlRawAsync(
        "CREATE TABLE IF NOT EXISTS `Contatos` (" +
        "`Id` INT NOT NULL AUTO_INCREMENT, " +
        "`ColegioId` INT NOT NULL, " +
        "`Nome` VARCHAR(200) NOT NULL DEFAULT '', " +
        "`Telefone` VARCHAR(50) NULL, " +
        "`Email` VARCHAR(200) NULL, " +
        "`Cargo` VARCHAR(100) NULL, " +
        "`DataCriacao` DATETIME NOT NULL, " +
        "`DataAtualizacao` DATETIME NULL, " +
        "`Ativo` TINYINT(1) NOT NULL DEFAULT 1, " +
        "PRIMARY KEY (`Id`), " +
        "INDEX `IX_Contatos_ColegioId` (`ColegioId`)" +
        ") ENGINE=InnoDB");
}

static async Task GarantirTabelaEscolasCrmAsync(ApplicationDbContextTesisFlow db)
{
    await db.Database.ExecuteSqlRawAsync(
        "CREATE TABLE IF NOT EXISTS `EscolasCrm` (" +
        "`Id` INT NOT NULL AUTO_INCREMENT, " +
        "`ColegioId` INT NOT NULL, " +
        "`ColegioNome` VARCHAR(300) NOT NULL DEFAULT '', " +
        "`EtapaComercial` INT NOT NULL DEFAULT 0, " +
        "`ResponsavelId` INT NULL, " +
        "`ResponsavelNome` VARCHAR(200) NULL, " +
        "`ContatoPrincipalId` INT NULL, " +
        "`ContatoPrincipalNome` VARCHAR(200) NULL, " +
        "`MotivoEncerramento` VARCHAR(300) NULL, " +
        "`MotivoObservacao` VARCHAR(500) NULL, " +
        "`DataConversao` DATETIME NULL, " +
        "`DataCriacao` DATETIME NOT NULL, " +
        "`DataAtualizacao` DATETIME NULL, " +
        "`Ativo` TINYINT(1) NOT NULL DEFAULT 1, " +
        "PRIMARY KEY (`Id`), " +
        "UNIQUE INDEX `IX_EscolasCrm_ColegioId` (`ColegioId`), " +
        "INDEX `IX_EscolasCrm_EtapaComercial` (`EtapaComercial`)" +
        ") ENGINE=InnoDB");
}

static async Task GarantirTabelaEscolasCrmHistoricoAsync(ApplicationDbContextTesisFlow db)
{
    await db.Database.ExecuteSqlRawAsync(
        "CREATE TABLE IF NOT EXISTS `EscolasCrmHistorico` (" +
        "`Id` INT NOT NULL AUTO_INCREMENT, " +
        "`EscolaCrmId` INT NOT NULL, " +
        "`EtapaAnterior` INT NOT NULL, " +
        "`EtapaNova` INT NOT NULL, " +
        "`UsuarioId` INT NOT NULL DEFAULT 0, " +
        "`UsuarioNome` VARCHAR(200) NOT NULL DEFAULT '', " +
        "`DataCriacao` DATETIME NOT NULL, " +
        "`DataAtualizacao` DATETIME NULL, " +
        "`Ativo` TINYINT(1) NOT NULL DEFAULT 1, " +
        "PRIMARY KEY (`Id`), " +
        "INDEX `IX_EscolasCrmHistorico_EscolaCrmId` (`EscolaCrmId`)" +
        ") ENGINE=InnoDB");
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
    var unico = Convert.ToInt64(await ObterEscalarAsync(db,
        "SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tabela AND INDEX_NAME = @indice AND NON_UNIQUE = 0",
        ("@tabela", "ColegioNotas"), ("@indice", "IX_ColegioNotas_ColegioId")));

    if (unico > 0)
    {
        await db.Database.ExecuteSqlRawAsync("ALTER TABLE `ColegioNotas` DROP INDEX `IX_ColegioNotas_ColegioId`");
    }

    var existe = Convert.ToInt64(await ObterEscalarAsync(db,
        "SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tabela AND INDEX_NAME = @indice",
        ("@tabela", "ColegioNotas"), ("@indice", "IX_ColegioNotas_ColegioId")));

    if (existe == 0)
    {
        await db.Database.ExecuteSqlRawAsync("CREATE INDEX `IX_ColegioNotas_ColegioId` ON `ColegioNotas` (`ColegioId`)");
    }
}
