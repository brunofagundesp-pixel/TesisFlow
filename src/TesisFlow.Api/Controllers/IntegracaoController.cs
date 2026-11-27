using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TesisFlow.Contexto.Contextos;
using TesisFlow.Core.Servicos.Integracoes;

namespace TesisFlow.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class IntegracaoController : ControllerBase
    {
        private readonly TesisCcService _tesisCcService;
        private readonly ApplicationDbContextTesisFlow _context;

        public IntegracaoController(TesisCcService tesisCcService, ApplicationDbContextTesisFlow context)
        {
            _tesisCcService = tesisCcService;
            _context = context;
        }

        [HttpGet("cliente/{id}")]
        public async Task<IActionResult> Cliente(int id)
            => Json(await _tesisCcService.GetRawAsync($"api/TesisCc/GetClienteIdColegio/{id}"));

        [HttpGet("contatos/{idCliente}")]
        public async Task<IActionResult> Contatos(int idCliente)
        {
            var raw = await _tesisCcService.GetRawAsync($"api/TesisCc/GetContatosIdCliente/{idCliente}");
            if (raw == null)
                return StatusCode(502, "Falha na integracao TesisCc.");

            JsonNode? parsed;
            try
            {
                parsed = JsonNode.Parse(raw);
            }
            catch (JsonException)
            {
                return Content(raw, "application/json");
            }

            if (parsed is not JsonArray contatos)
                return Content(raw, "application/json");

            var contatosPorChave = contatos
                .OfType<JsonObject>()
                .Select(item => (Item: item, Chave: LerString(item, "protocoloComentario")))
                .Where(x => !string.IsNullOrWhiteSpace(x.Chave) && System.Text.RegularExpressions.Regex.IsMatch(x.Chave, @"^[A-Z]{2,4}-\d+$", System.Text.RegularExpressions.RegexOptions.IgnoreCase))
                .ToList();
            var chaves = contatosPorChave.Select(x => x.Chave!).Distinct().ToArray();

            if (chaves.Length > 0)
            {
                var fotos = await (from tarefa in _context.Tarefas.AsNoTracking()
                                   join usuario in _context.Usuarios.AsNoTracking() on tarefa.CriadorId equals usuario.Id
                                   where tarefa.Ativo && tarefa.Chave != null && EF.Constant(chaves).Contains(tarefa.Chave)
                                   select new { tarefa.Chave, usuario.Foto })
                    .ToListAsync();
                var fotoPorChave = fotos
                    .GroupBy(x => x.Chave!)
                    .ToDictionary(g => g.Key, g => g.First().Foto, StringComparer.OrdinalIgnoreCase);

                foreach (var (item, chave) in contatosPorChave)
                {
                    if (fotoPorChave.TryGetValue(chave!, out var foto) && !string.IsNullOrWhiteSpace(foto))
                        item["usuarioFoto"] = foto;
                }
            }

            return Content(contatos.ToJsonString(), "application/json");
        }

        [HttpGet("diario/senha/{idDiario}")]
        public async Task<IActionResult> SenhaDiario(string idDiario)
        {
            var raw = await _tesisCcService.GetRawAsync($"api/Diario/SenhaMasterDiario/{idDiario}");
            if (raw == null)
                return StatusCode(502, "Falha ao obter a senha do Diario.");

            string senha;
            try
            {
                senha = JsonSerializer.Deserialize<string>(raw) ?? "";
            }
            catch (JsonException)
            {
                senha = raw.Trim().Trim('"');
            }

            return Content(senha, "text/plain");
        }

        [HttpGet("codigos-app/{idTesis}")]
        public async Task<IActionResult> CodigosApp(string idTesis)
            => Json(await _tesisCcService.GetRawAsync($"api/TesisTW/GetCodigosApp/{idTesis}"));

        [HttpGet("portal-aluno/usuarios/{idTesis}")]
        public async Task<IActionResult> PortalAlunoUsuarios(string idTesis)
            => Json(await _tesisCcService.GetRawAsync($"api/TesisTW/Usuarios/{idTesis}"));

        [HttpGet("portal-aluno/administradores/{idTesis}")]
        public async Task<IActionResult> PortalAlunoAdministradores(string idTesis)
            => Json(await _tesisCcService.GetRawAsync($"api/TesisTW/Administradores/{idTesis}"));

        [HttpGet("professores/{idDiario}/{ano}")]
        public async Task<IActionResult> Professores(string idDiario, string ano)
            => Json(await _tesisCcService.GetRawAsync($"api/Diario/GetProfessoresAno/{idDiario}/{ano}"));

        [HttpGet("parcelas/{idColegio}")]
        public async Task<IActionResult> Parcelas(int idColegio)
            => Json(await _tesisCcService.GetRawAsync($"api/TesisCc/GetParcelasClientes/{idColegio}"));

        [HttpGet("situacoes")]
        public async Task<IActionResult> Situacoes()
            => Ok(await _tesisCcService.ListarSituacoesAsync());

        private IActionResult Json(string? raw)
        {
            if (raw == null)
                return StatusCode(502, "Falha na integracao TesisCc.");

            return Content(raw, "application/json");
        }

        private static string? LerString(JsonObject item, string nome)
        {
            var propriedade = item.FirstOrDefault(p => string.Equals(p.Key, nome, StringComparison.OrdinalIgnoreCase));
            return propriedade.Value is JsonValue valor && valor.TryGetValue<string>(out var texto) ? texto : null;
        }
    }
}
