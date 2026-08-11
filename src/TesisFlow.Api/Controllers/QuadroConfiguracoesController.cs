using Microsoft.AspNetCore.Mvc;
using TesisFlow.Core.Servicos.QuadroConfiguracoes;
using TesisFlow.Modelo.DTOs;

namespace TesisFlow.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class QuadroConfiguracoesController : ControllerBase
    {
        private readonly QuadroConfiguracaoConsultar _consultar;
        private readonly QuadroConfiguracaoSalvar _salvar;

        public QuadroConfiguracoesController(QuadroConfiguracaoConsultar consultar, QuadroConfiguracaoSalvar salvar)
        {
            _consultar = consultar;
            _salvar = salvar;
        }

        [HttpGet("projeto/{projetoId}")]
        public async Task<IActionResult> ObterPorProjeto(int projetoId)
        {
            var quadros = await _consultar.ObterPorProjetoAsync(projetoId);
            return Ok(quadros);
        }

        [HttpPost("projeto/{projetoId}")]
        public async Task<IActionResult> CriarQuadros(int projetoId, [FromBody] List<QuadroConfiguracaoSalvarDTO> dtos)
        {
            var quadros = await _salvar.CriarParaProjetoAsync(projetoId, dtos);
            return CreatedAtAction(nameof(ObterPorProjeto), new { projetoId }, quadros);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Atualizar(int id, [FromBody] QuadroConfiguracaoSalvarDTO dto)
        {
            var quadro = await _salvar.AtualizarAsync(id, dto);
            return Ok(quadro);
        }

        [HttpPut("projeto/{projetoId}")]
        public async Task<IActionResult> SubstituirQuadros(int projetoId, [FromBody] List<QuadroConfiguracaoSalvarDTO> dtos)
        {
            var quadros = await _salvar.SubstituirQuadrosAsync(projetoId, dtos);
            return Ok(quadros);
        }
    }
}
