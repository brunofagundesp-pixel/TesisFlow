using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using TesisFlow.Core.Servicos.Integracoes;

namespace TesisFlow.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class IntegracaoController : ControllerBase
    {
        private readonly TesisCcService _tesisCcService;

        public IntegracaoController(TesisCcService tesisCcService)
        {
            _tesisCcService = tesisCcService;
        }

        [HttpGet("cliente/{id}")]
        public async Task<IActionResult> Cliente(int id)
            => Json(await _tesisCcService.GetRawAsync($"api/TesisCc/GetClienteIdColegio/{id}"));

        [HttpGet("contatos/{idCliente}")]
        public async Task<IActionResult> Contatos(int idCliente)
            => Json(await _tesisCcService.GetRawAsync($"api/TesisCc/GetContatosIdCliente/{idCliente}"));

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

        private IActionResult Json(string? raw)
        {
            if (raw == null)
                return StatusCode(502, "Falha na integracao TesisCc.");

            return Content(raw, "application/json");
        }
    }
}
