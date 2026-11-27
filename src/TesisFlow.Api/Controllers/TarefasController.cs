using System.Security.Claims;
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
        private readonly TarefaMeuDiaServico _meuDia;

        public TarefasController(
            TarefaConsultar consultar,
            TarefaSalvar salvar,
            TarefaExcluir excluir,
            TarefaMeuDiaServico meuDia)
        {
            _consultar = consultar;
            _salvar = salvar;
            _excluir = excluir;
            _meuDia = meuDia;
        }

        [HttpGet("buscar")]
        public async Task<IActionResult> Buscar([FromQuery] string termo)
        {
            if (string.IsNullOrWhiteSpace(termo) || termo.Length < 2)
                return Ok(new List<TarefaDTO>());

            var tarefas = await _consultar.BuscarAsync(termo.Trim(), UsuarioAtual());
            return Ok(tarefas);
        }

        [HttpGet("chave/{chave}")]
        public async Task<IActionResult> GetByChave(string chave)
        {
            var tarefa = await _consultar.ObterPorChaveAsync(chave, UsuarioAtual());
            if (tarefa == null) return NotFound();
            return Ok(tarefa);
        }

        [HttpGet("projeto/{projetoId}")]
        public async Task<IActionResult> GetByProjeto(int projetoId)
        {
            var tarefas = await _consultar.ObterPorProjetoAsync(projetoId, UsuarioAtual());
            return Ok(tarefas);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var tarefa = await _consultar.ObterPorIdAsync(id, UsuarioAtual());
            if (tarefa == null) return NotFound();
            return Ok(tarefa);
        }

        [HttpGet("sprint/{sprintId}")]
        public async Task<IActionResult> GetBySprint(int sprintId)
        {
            var tarefas = await _consultar.ObterPorSprintAsync(sprintId, UsuarioAtual());
            return Ok(tarefas);
        }

        [HttpGet("responsavel")]
        public async Task<IActionResult> GetByResponsavel()
        {
            var tarefas = await _consultar.ObterPorResponsavelAsync(UsuarioAtual());
            return Ok(tarefas);
        }

        [HttpGet("meu-dia")]
        public async Task<IActionResult> GetMeuDia()
        {
            var ids = await _meuDia.ObterIdsAsync(UsuarioAtual());
            return Ok(ids);
        }

        [HttpGet("meu-dia/tarefas")]
        public async Task<IActionResult> GetMeuDiaTarefas()
        {
            var tarefas = await _consultar.ObterPorMeuDiaAsync(UsuarioAtual());
            return Ok(tarefas);
        }

        [HttpGet("lixeira")]
        public async Task<IActionResult> GetLixeira()
        {
            var tarefas = await _consultar.ListarLixeiraAsync(UsuarioAtual());
            return Ok(tarefas);
        }

        [HttpPut("meu-dia/toggle")]
        public async Task<IActionResult> AlternarMeuDia([FromBody] TarefaMeuDiaToggleDTO dto)
        {
            var ativo = await _meuDia.AlternarAsync(dto.TarefaId, dto.UsuarioId);
            return Ok(new { ativo });
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
                return Ok(new { tarefa.Id, tarefa.Titulo, tarefa.Chave, tarefa.Status });
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

        [HttpPut("reordenar")]
        public async Task<IActionResult> Reordenar([FromBody] List<TarefaMoverDTO> itens)
        {
            await _salvar.ReordenarAsync(itens);
            return Ok();
        }

        [HttpPut("em-massa/status")]
        public async Task<IActionResult> AlterarStatusEmMassa([FromBody] TarefaEmMassaDTO dto)
        {
            await _salvar.AlterarStatusEmMassaAsync(dto.Ids, (Modelo.Enums.StatusTarefa)dto.Valor, dto.UsuarioId ?? 0);
            return Ok();
        }

        [HttpPut("em-massa/prioridade")]
        public async Task<IActionResult> AlterarPrioridadeEmMassa([FromBody] TarefaEmMassaDTO dto)
        {
            await _salvar.AlterarPrioridadeEmMassaAsync(dto.Ids, (Modelo.Enums.PrioridadeTarefa)dto.Valor, dto.UsuarioId ?? 0);
            return Ok();
        }

        [HttpPost("em-massa/excluir")]
        public async Task<IActionResult> ExcluirEmMassa([FromBody] TarefaExcluirEmMassaDTO dto)
        {
            await _excluir.ExcluirEmMassaAsync(dto.Ids);
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

        [HttpPost("{id}/restaurar")]
        public async Task<IActionResult> Restaurar(int id)
        {
            try
            {
                var tarefa = await _salvar.RestaurarAsync(id);
                return Ok(new { tarefa.Id, tarefa.Titulo, tarefa.Chave, tarefa.Status });
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        [HttpDelete("{id}/definitivo")]
        public async Task<IActionResult> ExcluirDefinitivo(int id)
        {
            try
            {
                await _excluir.ExcluirDefinitivamenteAsync(id);
                return NoContent();
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        private int UsuarioAtual()
        {
            var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(idStr, out var id) ? id : 0;
        }
    }
}
