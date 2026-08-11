using Microsoft.AspNetCore.Mvc;
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

        public SprintsController(SprintConsultar consultar, SprintSalvar salvar, SprintExcluir excluir)
        {
            _consultar = consultar;
            _salvar = salvar;
            _excluir = excluir;
        }

        [HttpGet("projeto/{projetoId}")]
        public async Task<IActionResult> GetByProjeto(int projetoId)
        {
            var sprints = await _consultar.ObterPorProjetoAsync(projetoId);
            return Ok(sprints);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var sprint = await _consultar.ObterPorIdAsync(id);
            if (sprint == null) return NotFound();
            return Ok(sprint);
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] SprintSalvarDTO dto)
        {
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
    }
}
