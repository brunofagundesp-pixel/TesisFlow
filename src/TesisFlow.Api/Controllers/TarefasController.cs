using Microsoft.AspNetCore.Mvc;
using TesisFlow.Core.Servicos.Tarefas;
using TesisFlow.Modelo.DTOs;

namespace TesisFlow.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TarefasController : ControllerBase
    {
        private readonly TarefaConsultar _consultar;
        private readonly TarefaSalvar _salvar;
        private readonly TarefaExcluir _excluir;

        public TarefasController(TarefaConsultar consultar, TarefaSalvar salvar, TarefaExcluir excluir)
        {
            _consultar = consultar;
            _salvar = salvar;
            _excluir = excluir;
        }

        [HttpGet("buscar")]
        public async Task<IActionResult> Buscar([FromQuery] string termo, [FromQuery] int usuarioId)
        {
            if (string.IsNullOrWhiteSpace(termo) || termo.Length < 2)
                return Ok(new List<TarefaDTO>());

            var tarefas = await _consultar.BuscarAsync(termo.Trim(), usuarioId);
            return Ok(tarefas);
        }

        [HttpGet("chave/{chave}")]
        public async Task<IActionResult> GetByChave(string chave)
        {
            var tarefa = await _consultar.ObterPorChaveAsync(chave);
            if (tarefa == null) return NotFound();
            return Ok(tarefa);
        }

        [HttpGet("projeto/{projetoId}")]
        public async Task<IActionResult> GetByProjeto(int projetoId)
        {
            var tarefas = await _consultar.ObterPorProjetoAsync(projetoId);
            return Ok(tarefas);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var tarefa = await _consultar.ObterPorIdAsync(id);
            if (tarefa == null) return NotFound();
            return Ok(tarefa);
        }

        [HttpGet("sprint/{sprintId}")]
        public async Task<IActionResult> GetBySprint(int sprintId)
        {
            var tarefas = await _consultar.ObterPorSprintAsync(sprintId);
            return Ok(tarefas);
        }

        [HttpGet("responsavel/{usuarioId}")]
        public async Task<IActionResult> GetByResponsavel(int usuarioId)
        {
            var tarefas = await _consultar.ObterPorResponsavelAsync(usuarioId);
            return Ok(tarefas);
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] TarefaSalvarDTO dto)
        {
            try
            {
                var tarefa = await _salvar.CriarAsync(dto);
                return Ok(new { tarefa.Id, tarefa.Titulo, tarefa.Chave, tarefa.Status });
            }
            catch (KeyNotFoundException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, [FromBody] TarefaSalvarDTO dto)
        {
            try
            {
                var tarefa = await _salvar.AtualizarAsync(id, dto);
                return Ok(tarefa);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        [HttpPut("mover")]
        public async Task<IActionResult> Mover([FromBody] TarefaMoverDTO dto)
        {
            await _salvar.MoverAsync(dto);
            return Ok();
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
