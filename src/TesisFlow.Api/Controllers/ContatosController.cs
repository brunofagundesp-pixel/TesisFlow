using Microsoft.AspNetCore.Mvc;
using TesisFlow.Core.Servicos.Atendimentos;
using TesisFlow.Modelo.DTOs;

namespace TesisFlow.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ContatosController : ControllerBase
    {
        private readonly ContatoConsultar _consultar;
        private readonly ContatoSalvar _salvar;
        private readonly ContatoExcluir _excluir;

        public ContatosController(ContatoConsultar consultar, ContatoSalvar salvar, ContatoExcluir excluir)
        {
            _consultar = consultar;
            _salvar = salvar;
            _excluir = excluir;
        }

        [HttpGet("colegio/{colegioId}")]
        public async Task<IActionResult> GetPorColegio(int colegioId)
        {
            var contatos = await _consultar.ObterPorColegioAsync(colegioId);
            return Ok(contatos);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var contato = await _consultar.ObterPorIdAsync(id);
            if (contato == null) return NotFound();
            return Ok(contato);
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] ContatoSalvarDTO dto)
        {
            var contato = await _salvar.CriarAsync(dto);
            return Ok(contato);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, [FromBody] ContatoSalvarDTO dto)
        {
            try
            {
                var contato = await _salvar.AtualizarAsync(id, dto);
                return Ok(contato);
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
