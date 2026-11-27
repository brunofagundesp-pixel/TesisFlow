using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TesisFlow.Contexto.Contextos;
using TesisFlow.Core.Servicos.Acesso;
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
        private readonly ApplicationDbContextTesisFlow _context;
        private readonly ProjetoAcessoService _acesso;

        public QuadroConfiguracoesController(QuadroConfiguracaoConsultar consultar, QuadroConfiguracaoSalvar salvar, ApplicationDbContextTesisFlow context, ProjetoAcessoService acesso)
        {
            _consultar = consultar;
            _salvar = salvar;
            _context = context;
            _acesso = acesso;
        }

        [HttpGet("projeto/{projetoId}")]
        public async Task<IActionResult> ObterPorProjeto(int projetoId)
        {
            if (!await PodeAsync(projetoId)) return Forbid();

            var quadros = await _consultar.ObterPorProjetoAsync(projetoId);
            return Ok(quadros);
        }

        [HttpPost("projeto/{projetoId}")]
        public async Task<IActionResult> CriarQuadros(int projetoId, [FromBody] List<QuadroConfiguracaoSalvarDTO> dtos)
        {
            if (!await PodeAsync(projetoId)) return Forbid();

            var quadros = await _salvar.CriarParaProjetoAsync(projetoId, dtos);
            return CreatedAtAction(nameof(ObterPorProjeto), new { projetoId }, quadros);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Atualizar(int id, [FromBody] QuadroConfiguracaoSalvarDTO dto)
        {
            var projetoId = await _context.QuadroConfiguracoes
                .Where(q => q.Id == id)
                .Select(q => q.ProjetoId)
                .FirstOrDefaultAsync();

            if (!await PodeAsync(projetoId)) return Forbid();

            var quadro = await _salvar.AtualizarAsync(id, dto);
            return Ok(quadro);
        }

        [HttpPut("projeto/{projetoId}")]
        public async Task<IActionResult> SubstituirQuadros(int projetoId, [FromBody] List<QuadroConfiguracaoSalvarDTO> dtos)
        {
            if (!await PodeAsync(projetoId)) return Forbid();

            var quadros = await _salvar.SubstituirQuadrosAsync(projetoId, dtos);
            return Ok(quadros);
        }

        private async Task<bool> PodeAsync(int projetoId)
        {
            return projetoId != 0 && (User.IsInRole("Admin") || await _acesso.PodeAcessarProjetoAsync(projetoId, UsuarioAtual()));
        }

        private int UsuarioAtual()
        {
            var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(idStr, out var id) ? id : 0;
        }
    }
}
