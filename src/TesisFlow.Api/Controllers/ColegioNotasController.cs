using Microsoft.AspNetCore.Mvc;
using TesisFlow.Core.Servicos.ColegioNotas;
using TesisFlow.Modelo.DTOs;

namespace TesisFlow.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ColegioNotasController : ControllerBase
    {
        private readonly ColegioNotaConsultar _consultar;
        private readonly ColegioNotaSalvar _salvar;
        private readonly ColegioNotaExcluir _excluir;
        private readonly ColegioNotaSincronizar _sincronizar;

        public ColegioNotasController(ColegioNotaConsultar consultar, ColegioNotaSalvar salvar, ColegioNotaExcluir excluir, ColegioNotaSincronizar sincronizar)
        {
            _consultar = consultar;
            _salvar = salvar;
            _excluir = excluir;
            _sincronizar = sincronizar;
        }

        [HttpGet("{colegioId}")]
        public async Task<IActionResult> Get(int colegioId, [FromQuery] int top = 20, [FromQuery] int skip = 0)
        {
            var (itens, total) = await _consultar.ObterPorColegioAsync(colegioId, top, skip);
            return Ok(new { itens, total });
        }

        [HttpPost("{colegioId}/sincronizar-parceiros")]
        public async Task<IActionResult> SincronizarParceiros(int colegioId)
        {
            var criadas = await _sincronizar.SincronizarParceirosAsync(colegioId);
            return Ok(criadas);
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] ColegioNotaSalvarDTO dto)
        {
            var nota = await _salvar.CriarAsync(dto);
            return Ok(nota);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, [FromBody] ColegioNotaSalvarDTO dto)
        {
            try
            {
                var nota = await _salvar.AtualizarAsync(id, dto);
                return Ok(nota);
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
                return Ok();
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }
    }
}
