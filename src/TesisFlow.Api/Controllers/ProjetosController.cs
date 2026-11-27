using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TesisFlow.Core.Servicos.Projetos;
using TesisFlow.Modelo.DTOs;

namespace TesisFlow.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProjetosController : ControllerBase
    {
        private readonly ProjetoConsultar _consultar;
        private readonly ProjetoSalvar _salvar;
        private readonly ProjetoExcluir _excluir;

        public ProjetosController(ProjetoConsultar consultar, ProjetoSalvar salvar, ProjetoExcluir excluir)
        {
            _consultar = consultar;
            _salvar = salvar;
            _excluir = excluir;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var projetos = await _consultar.ObterPorUsuarioAsync(UsuarioAtual());
            return Ok(projetos);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var usuarioId = UsuarioAtual();
            var projeto = await _consultar.ObterPorIdAsync(id);
            if (projeto == null) return NotFound();

            if (!User.IsInRole("Admin")
                && projeto.LiderId != usuarioId
                && !projeto.Membros.Any(m => m.UsuarioId == usuarioId))
                return Forbid();

            return Ok(projeto);
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] ProjetoSalvarDTO dto)
        {
            try
            {
                var projeto = await _salvar.CriarAsync(dto.Nome, dto.Descricao, dto.Cor, dto.Icone, UsuarioAtual());
                var projetoDto = await _consultar.ObterPorIdAsync(projeto.Id);
                return CreatedAtAction(nameof(GetById), new { id = projeto.Id }, projetoDto);
            }
            catch (KeyNotFoundException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, [FromBody] ProjetoSalvarDTO dto)
        {
            var usuarioId = UsuarioAtual();
            var atual = await _consultar.ObterPorIdAsync(id);
            if (atual == null) return NotFound();

            if (!User.IsInRole("Admin") && atual.LiderId != usuarioId)
                return Forbid();

            try
            {
                await _salvar.AtualizarAsync(id, dto.Nome, dto.Descricao, dto.Cor, dto.Icone, dto.LiderId);
                var projetoDto = await _consultar.ObterPorIdAsync(id);
                return Ok(projetoDto);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        [Authorize(Roles = "Admin")]
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

        [HttpPost("{id}/membros")]
        public async Task<IActionResult> AdicionarMembro(int id, [FromBody] ConvidarMembroDTO dto)
        {
            try
            {
                await _salvar.AdicionarMembroAsync(id, dto.Email);
                return Ok();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { mensagem = ex.Message });
            }
        }

        [HttpPut("{id}/membros/aceitar")]
        public async Task<IActionResult> AceitarConvite(int id, [FromBody] MembroAcaoDTO dto)
        {
            try
            {
                await _salvar.AceitarConviteAsync(id, dto.UsuarioId);
                return Ok();
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        [HttpPut("{id}/membros/recusar")]
        public async Task<IActionResult> RecusarConvite(int id, [FromBody] MembroAcaoDTO dto)
        {
            try
            {
                await _salvar.RecusarConviteAsync(id, dto.UsuarioId);
                return Ok();
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
