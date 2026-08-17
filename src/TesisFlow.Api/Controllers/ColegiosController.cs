using Microsoft.AspNetCore.Mvc;
using TesisFlow.Core.Servicos.Integracoes;

namespace TesisFlow.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ColegiosController : ControllerBase
    {
        private readonly TesisCcService _tesisCcService;

        public ColegiosController(TesisCcService tesisCcService)
        {
            _tesisCcService = tesisCcService;
        }

        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] int? top, [FromQuery] int? skip)
        {
            var (itens, total) = await _tesisCcService.ListarColegiosAsync(top, skip);

            if (top.HasValue)
                return Ok(new { itens, total });

            return Ok(itens);
        }
    }
}
