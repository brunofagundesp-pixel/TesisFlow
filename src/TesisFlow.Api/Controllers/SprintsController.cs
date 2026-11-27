using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TesisFlow.Contexto.Contextos;
using TesisFlow.Core.Servicos.Acesso;
using TesisFlow.Core.Servicos.Sprints;
using TesisFlow.Modelo.DTOs;

namespace TesisFlow.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SprintsController : ControllerBase
    {
        private readonly SprintConsultar _consultar;
        private readonly SprintSalvar _salvar;
        private readonly SprintExcluir _excluir;
        private readonly ApplicationDbContextTesisFlow _context;
        private readonly ProjetoAcessoService _acesso;

        public SprintsController(SprintConsultar consultar, SprintSalvar salvar, SprintExcluir excluir, ApplicationDbContextTesisFlow context, ProjetoAcessoService acesso)
        {
            _consultar = consultar;
            _salvar = salvar;
            _excluir = excluir;
            _context = context;
            _acesso = acesso;
        }

        [HttpGet("projeto/{projetoId}")]
        public async Task<IActionResult> GetByProjeto(int projetoId)
        {
            if (!await PodeAsync(projetoId)) return Forbid();

            var sprints = await _consultar.ObterPorProjetoAsync(projetoId);
            return Ok(sprints);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var projetoId = await ObterProjetoIdAsync(id);
            if (!await PodeAsync(projetoId)) return Forbid();

            var sprint = await _consultar.ObterPorIdAsync(id);
            if (sprint == null) return NotFound();
            return Ok(sprint);
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] SprintSalvarDTO dto)
        {
            if (!await PodeAsync(dto.ProjetoId)) return Forbid();

            try
            {
                var sprint = await _salvar.CriarAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = sprint.Id }, sprint);
            }
            catch (KeyNotFoundException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, [FromBody] SprintSalvarDTO dto)
        {
            if (!await PodeAsync(await ObterProjetoIdAsync(id))) return Forbid();

            try
            {
                var sprint = await _salvar.AtualizarAsync(id, dto);
                return Ok(sprint);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            if (!await PodeAsync(await ObterProjetoIdAsync(id))) return Forbid();

            try
            {
                await _excluir.ExcluirAsync(id);
                return NoContent();
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        private async Task<int> ObterProjetoIdAsync(int sprintId)
        {
            return await _context.Sprints
                .Where(s => s.Id == sprintId)
                .Select(s => s.ProjetoId)
                .FirstOrDefaultAsync();
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
