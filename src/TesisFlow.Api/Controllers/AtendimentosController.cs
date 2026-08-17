using Microsoft.AspNetCore.Mvc;
using TesisFlow.Core.Servicos.Integracoes;
using TesisFlow.Modelo.DTOs;

namespace TesisFlow.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AtendimentosController : ControllerBase
    {
        private readonly TesisCcService _tesisCcService;

        public AtendimentosController(TesisCcService tesisCcService)
        {
            _tesisCcService = tesisCcService;
        }

        [HttpPost("salvar")]
        public async Task<IActionResult> Salvar([FromBody] TesisCcContatoDTO dto)
        {
            var idContato = await _tesisCcService.SalvarContatoAsync(dto);
            return Ok(new { idContato });
        }
    }
}
