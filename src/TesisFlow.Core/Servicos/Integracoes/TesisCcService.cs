using System.IdentityModel.Tokens.Jwt;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Globalization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using TesisFlow.Modelo.DTOs;

namespace TesisFlow.Core.Servicos.Integracoes
{
    public class TesisCcService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<TesisCcService> _logger;
        private readonly IConfiguration _configuration;

        public TesisCcService(IHttpClientFactory httpClientFactory, ILogger<TesisCcService> logger, IConfiguration configuration)
        {
            _httpClientFactory = httpClientFactory;
            _logger = logger;
            _configuration = configuration;
        }

        /// <summary>
        /// Gera o JWT do sistema usado para chamar a API externa TesisCc.
        /// Assinado em HS256 com a chave configurada, claim sid = SystemSid.
        /// </summary>
        public string GerarSystemToken()
        {
            var sid = _configuration["TesisCc:SystemSid"] ?? "23562";
            return GerarToken(sid);
        }

        public string GerarToken(string sid)
        {
            var key = _configuration["TesisCc:JwtKey"];
            var issuer = _configuration["TesisCc:JwtIssuer"] ?? "tesis.inf.br";
            var audience = _configuration["TesisCc:JwtAudience"] ?? "tesis.inf.br";
            var expireHoras = double.TryParse(_configuration["TesisCc:JwtExpireHours"], out var h) ? h : 24;

            var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key ?? string.Empty));
            var creds = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

            var agora = DateTimeOffset.UtcNow;
            var expira = agora.AddHours(expireHoras);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: new[] { new Claim("sid", sid) },
                notBefore: agora.UtcDateTime,
                expires: expira.UtcDateTime,
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        /// <summary>
        /// Faz um GET generico na API externa usando o token do sistema e devolve o corpo cru.
        /// </summary>
        public async Task<string?> GetRawAsync(string path)
        {
            try
            {
                var client = _httpClientFactory.CreateClient("TesisCc");
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", GerarSystemToken());
                var response = await client.GetAsync(path);

                if (!response.IsSuccessStatusCode)
                {
                    var corpo = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning("TesisCc {Path} retornou {Status}: {Corpo}", path, (int)response.StatusCode, corpo);
                    return null;
                }

                return await response.Content.ReadAsStringAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao chamar {Path} na TesisCc", path);
                return null;
            }
        }

        /// <summary>
        /// Lista os colegios (clientes ativos) na API externa, usando o token do sistema.
        /// </summary>
        public async Task<(List<ColegioDTO> Itens, int Total)> ListarColegiosAsync(
            int? top = null,
            int? skip = null,
            string? situacao = null,
            string? busca = null,
            string? uf = null,
            string? municipio = null)
        {
            var vazio = (new List<ColegioDTO>(), 0);

            try
            {
                var filtros = new List<string>();

                if (string.IsNullOrWhiteSpace(situacao))
                    filtros.Add("situacao eq 'CLIENTE ATIVO'");
                else if (!string.Equals(situacao, "Todos", StringComparison.OrdinalIgnoreCase))
                    filtros.Add($"situacao eq '{situacao.Trim().Replace("'", "''")}'");

                if (!string.IsNullOrWhiteSpace(uf))
                    filtros.Add($"uf eq '{uf.Trim().Replace("'", "''")}'");

                if (!string.IsNullOrWhiteSpace(municipio))
                    filtros.Add($"municipio eq '{municipio.Trim().Replace("'", "''")}'");

                var client = _httpClientFactory.CreateClient("TesisCc");
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", GerarSystemToken());

                var termoBusca = RemoverAcentos(busca ?? string.Empty).Trim();
                var filtrarBusca = termoBusca.Length > 0;
                var tamanhoPagina = filtrarBusca ? 500 : top;
                var offset = filtrarBusca ? 0 : skip ?? 0;
                var correspondencias = new List<ColegioDTO>();
                var totalFiltrado = 0;
                var totalApi = 0;

                do
                {
                    var url = "odata/cc_cliente?";
                    if (filtros.Count > 0)
                        url += $"$filter={Uri.EscapeDataString(string.Join(" and ", filtros))}&";
                    if (tamanhoPagina.HasValue) url += $"$top={tamanhoPagina.Value}&";
                    if (offset > 0 || filtrarBusca) url += $"$skip={offset}&";
                    url += "$count=true&$orderby=idColegio";

                    var response = await client.GetAsync(url);
                    if (!response.IsSuccessStatusCode)
                    {
                        var corpo = await response.Content.ReadAsStringAsync();
                        _logger.LogWarning("TesisCc ListarColegios retornou {Status}: {Corpo}", (int)response.StatusCode, corpo);
                        return vazio;
                    }

                    var json = await response.Content.ReadAsStringAsync();
                    var data = JsonSerializer.Deserialize<ColegioODataResponseDTO>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (data == null) return vazio;

                    var itens = data.Value.Select(MapColegio).ToList();
                    totalApi = data.Count ?? totalApi;
                    if (!filtrarBusca) return (itens, totalApi > 0 ? totalApi : itens.Count);

                    var filtrados = itens.Where(c =>
                        RemoverAcentos(c.Nome).Contains(termoBusca, StringComparison.OrdinalIgnoreCase) ||
                        RemoverAcentos(c.Apelido).Contains(termoBusca, StringComparison.OrdinalIgnoreCase)).ToList();
                    totalFiltrado += filtrados.Count;
                    var paginaInicio = skip ?? 0;
                    if (totalFiltrado > paginaInicio && (!top.HasValue || correspondencias.Count < top.Value))
                        correspondencias.AddRange(filtrados
                            .Skip(Math.Max(0, paginaInicio - (totalFiltrado - filtrados.Count)))
                            .Take(top.HasValue ? top.Value - correspondencias.Count : int.MaxValue));
                    offset += itens.Count;
                    if (itens.Count == 0 || offset >= totalApi) break;
                }
                while (filtrarBusca);

                return (correspondencias, totalFiltrado);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao listar colegios na TesisCc");
                return vazio;
            }
        }

        /// <summary>
        /// Lista todos os colegios que atendem aos filtros, paginando internamente
        /// na API externa (usado para exportacao).
        /// </summary>
        public async Task<List<ColegioDTO>> ListarTodosFiltradosAsync(
            string? situacao = null,
            string? busca = null,
            string? uf = null,
            string? municipio = null)
        {
            var resultado = new List<ColegioDTO>();
            const int tamanhoPagina = 500;

            try
            {
                if (!string.IsNullOrWhiteSpace(busca))
                {
                    var (itens, _) = await ListarColegiosAsync(null, 0, situacao, busca, uf, municipio);
                    resultado.AddRange(itens);
                }
                else
                {
                    var skip = 0;
                    while (true)
                    {
                        var (itens, total) = await ListarColegiosAsync(tamanhoPagina, skip, situacao, null, uf, municipio);
                        if (itens.Count == 0) break;
                        resultado.AddRange(itens);
                        skip += itens.Count;
                        if (skip >= total) break;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao listar todos os colegios na TesisCc");
            }

            return resultado;
        }

        /// <summary>
        /// Lista os estados (UF) e municipios distintos disponiveis na API externa TesisCc.
        /// </summary>
        public async Task<(List<string> Estados, Dictionary<string, List<string>> CidadesPorEstado)> ListarFiltrosAsync()
        {
            var estados = new List<string>();
            var cidadesPorEstado = new Dictionary<string, List<string>>();

            try
            {
                var client = _httpClientFactory.CreateClient("TesisCc");
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", GerarSystemToken());

                var response = await client.GetAsync("odata/cc_cliente?$apply=groupby((uf,municipio))");
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("TesisCc ListarFiltros retornou {Status}", (int)response.StatusCode);
                    return (estados, cidadesPorEstado);
                }

                var json = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(json);

                if (!doc.RootElement.TryGetProperty("value", out var value) || value.ValueKind != JsonValueKind.Array)
                    return (estados, cidadesPorEstado);

                var vistos = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

                foreach (var item in value.EnumerateArray())
                {
                    var uf = item.TryGetProperty("uf", out var u) && u.ValueKind == JsonValueKind.String ? (u.GetString() ?? "").Trim() : "";
                    var municipio = item.TryGetProperty("municipio", out var m) && m.ValueKind == JsonValueKind.String ? (m.GetString() ?? "").Trim() : "";

                    if (string.IsNullOrWhiteSpace(uf) || string.IsNullOrWhiteSpace(municipio))
                        continue;

                    if (!vistos.Add($"{uf}\u0001{municipio}"))
                        continue;

                    if (!cidadesPorEstado.TryGetValue(uf, out var lista))
                    {
                        lista = new List<string>();
                        cidadesPorEstado[uf] = lista;
                    }
                    lista.Add(municipio);
                }

                estados = cidadesPorEstado.Keys.OrderBy(x => x, StringComparer.OrdinalIgnoreCase).ToList();
                foreach (var chave in cidadesPorEstado.Keys.ToList())
                {
                    cidadesPorEstado[chave] = cidadesPorEstado[chave].OrderBy(x => x, StringComparer.OrdinalIgnoreCase).ToList();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao listar filtros de colegios na TesisCc");
            }

            return (estados, cidadesPorEstado);
        }

        private static ColegioDTO MapColegio(ColegioODataDTO api) => new()
        {
            Id = api.IdColegio,
            Nome = api.Nome ?? string.Empty,
            Apelido = api.Apelido ?? string.Empty,
            Status = (api.Situacao ?? string.Empty).ToUpperInvariant().Contains("ATIVO") ? "Ativo" : "Inativo",
            Situacao = api.Situacao ?? string.Empty,
            Estado = api.Uf ?? string.Empty,
            Cidade = api.Municipio ?? string.Empty,
            Contato = api.Contato ?? string.Empty,
            Telefone = api.Telefone ?? string.Empty,
            CodigoDiario = api.IdDiario?.ToString() ?? string.Empty,
            SenhaMasterDiario = string.Empty,
            CodigoPortalAluno = api.IdPortalAluno ?? string.Empty,
            CodigoAplicativo = string.Empty,
            ApelidoAplicativo = string.Empty,
            Email = api.Email ?? string.Empty,
            LinkTGE = string.Empty,
            Cnpj = api.Cnpj ?? string.Empty,
            Endereco = api.Endereco ?? string.Empty,
            Bairro = api.Bairro ?? string.Empty,
            Cep = api.Cep ?? string.Empty,
            IdTesis = api.IdTesis ?? string.Empty,
            IdDiarioRaw = api.IdDiario,
        };

        private static string RemoverAcentos(string texto)
        {
            var decomposed = texto.Normalize(NormalizationForm.FormD);
            var chars = decomposed.Where(c => CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark).ToArray();
            return new string(chars).Normalize(NormalizationForm.FormC);
        }

        /// <summary>
        /// Lista as situacoes de cliente disponiveis na API externa TesisCc.
        /// </summary>
        public async Task<List<string>> ListarSituacoesAsync()
        {
            try
            {
                var client = _httpClientFactory.CreateClient("TesisCc");
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", GerarSystemToken());

                var response = await client.GetAsync("api/tesiscc/GetSituacaoCliente");
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("TesisCc GetSituacaoCliente retornou {Status}", (int)response.StatusCode);
                    return new List<string>();
                }

                var json = await response.Content.ReadAsStringAsync();
                var itens = JsonSerializer.Deserialize<List<SituacaoClienteDTO>>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                return itens?
                    .Select(s => s.Nome?.Trim())
                    .Where(n => !string.IsNullOrWhiteSpace(n))
                    .Select(n => n!)
                    .Distinct()
                    .OrderBy(n => n)
                    .ToList() ?? new List<string>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao listar situacoes na TesisCc");
                return new List<string>();
            }
        }

        /// <summary>
        /// Salva/atualiza um contato (atendimento) na API externa TesisCc.
        /// Retorna o idContato criado quando a resposta o informa; caso contrario, null.
        /// </summary>
        public async Task<int?> SalvarContatoAsync(TesisCcContatoDTO contato, string? sid = null)
        {
            try
            {
                var client = _httpClientFactory.CreateClient("TesisCc");
                var token = string.IsNullOrWhiteSpace(sid) ? GerarSystemToken() : GerarToken(sid);
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
                var response = await client.PostAsJsonAsync("api/tesiscc/SalvarContato", contato);

                if (!response.IsSuccessStatusCode)
                {
                    var corpo = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning("TesisCc SalvarContato retornou {Status}: {Corpo}", (int)response.StatusCode, corpo);
                    return null;
                }

                var json = await response.Content.ReadAsStringAsync();
                if (string.IsNullOrWhiteSpace(json)) return null;

                using var doc = JsonDocument.Parse(json);
                var raiz = doc.RootElement;

                // A API retorna o idContato como um numero puro (ex.: 57747).
                if (raiz.ValueKind == JsonValueKind.Number && raiz.TryGetInt32(out var idNum))
                    return idNum;

                if (raiz.ValueKind == JsonValueKind.Object)
                {
                    if (raiz.TryGetProperty("idContato", out var id) && id.TryGetInt32(out var idContato))
                        return idContato;
                    if (raiz.TryGetProperty("IdContato", out var id2) && id2.TryGetInt32(out var idContato2))
                        return idContato2;
                    if (raiz.TryGetProperty("id", out var id3) && id3.TryGetInt32(out var idContato3))
                        return idContato3;
                }

                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao sincronizar contato na TesisCc");
                return null;
            }
        }

        /// <summary>
        /// Remove um contato (atendimento) na API externa TesisCc.
        /// Usa o idContato quando disponivel; caso contrario, localiza o contato
        /// pelo protocoloComentario (chave da tarefa) no cliente informado.
        /// </summary>
        public async Task ExcluirContatoAsync(int? contatoId, int? idColegio, string? protocolo)
        {
            try
            {
                var client = _httpClientFactory.CreateClient("TesisCc");
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", GerarSystemToken());

                var id = contatoId;
                if (id == null && idColegio != null && !string.IsNullOrWhiteSpace(protocolo))
                {
                    id = await BuscarContatoIdPorProtocoloAsync(client, idColegio.Value, protocolo);
                }

                if (id == null)
                {
                    _logger.LogWarning(
                        "TesisCc ExcluirContato ignorado: sem idContato (contatoId={ContatoId}, idColegio={IdColegio}, protocolo={Protocolo})",
                        contatoId, idColegio, protocolo);
                    return;
                }

                var response = await client.DeleteAsync($"api/tesiscc/ExcluirContato/{id}");
                if (!response.IsSuccessStatusCode)
                {
                    var corpo = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning("TesisCc ExcluirContato retornou {Status}: {Corpo}", (int)response.StatusCode, corpo);
                }
                else
                {
                    _logger.LogInformation("TesisCc ExcluirContato ok (idContato={IdContato})", id);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao excluir contato na TesisCc");
            }
        }

        private async Task<int?> BuscarContatoIdPorProtocoloAsync(HttpClient client, int idColegio, string protocolo)
        {
            try
            {
                var response = await client.GetAsync($"api/tesiscc/GetContatosIdCliente/{idColegio}");
                if (!response.IsSuccessStatusCode) return null;

                var json = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(json);

                if (doc.RootElement.ValueKind != JsonValueKind.Array) return null;

                foreach (var item in doc.RootElement.EnumerateArray())
                {
                    if (item.TryGetProperty("protocoloComentario", out var proto) &&
                        proto.GetString() == protocolo &&
                        item.TryGetProperty("idContato", out var id) &&
                        id.TryGetInt32(out var idContato))
                    {
                        return idContato;
                    }
                }

                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar contato por protocolo na TesisCc");
                return null;
            }
        }
    }
}
