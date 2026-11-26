using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using TesisFlow.Core.Servicos.Atendimentos;
using TesisFlow.Modelo.DTOs;

namespace TesisFlow.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EscolaCrmController : ControllerBase
    {
        private readonly EscolaCrmConsultar _consultar;
        private readonly EscolaCrmSalvar _salvar;

        public EscolaCrmController(EscolaCrmConsultar consultar, EscolaCrmSalvar salvar)
        {
            _consultar = consultar;
            _salvar = salvar;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            return Ok(await _consultar.ObterTodosAsync());
        }

        [HttpGet("colegio/{colegioId}")]
        public async Task<IActionResult> GetPorColegio(int colegioId)
        {
            var escola = await _consultar.ObterPorColegioAsync(colegioId);
            if (escola == null) return NotFound();
            return Ok(escola);
        }

        [HttpGet("resumo")]
        public async Task<IActionResult> GetResumo()
        {
            return Ok(await _consultar.ObterResumoAsync());
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] EscolaCrmSalvarDTO dto)
        {
            var escola = await _salvar.CriarAsync(dto);
            var dtoCompleto = await _consultar.ObterPorColegioAsync(escola.ColegioId);
            return Ok(dtoCompleto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, [FromBody] EscolaCrmSalvarDTO dto)
        {
            var (usuarioId, usuarioNome) = UsuarioAtual();

            try
            {
                var escola = await _salvar.AtualizarAsync(id, dto, usuarioId, usuarioNome);
                var dtoCompleto = await _consultar.ObterPorColegioAsync(escola.ColegioId);
                return Ok(dtoCompleto);
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
                await _salvar.ExcluirAsync(id);
                return Ok();
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        private (int Id, string Nome) UsuarioAtual()
        {
            var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var nome = User.FindFirstValue(ClaimTypes.Name) ?? User.Identity?.Name ?? string.Empty;
            return (int.TryParse(idStr, out var id) ? id : 0, nome);
        }
    }
}
