using Microsoft.AspNetCore.Mvc;
using TesisFlow.Core.Servicos.Categorias;
using TesisFlow.Modelo.DTOs;

namespace TesisFlow.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriasController : ControllerBase
    {
        private readonly CategoriaConsultar _consultar;
        private readonly CategoriaSalvar _salvar;
        private readonly CategoriaExcluir _excluir;

        public CategoriasController(CategoriaConsultar consultar, CategoriaSalvar salvar, CategoriaExcluir excluir)
        {
            _consultar = consultar;
            _salvar = salvar;
            _excluir = excluir;
        }

        [HttpGet("projeto/{projetoId}")]
        public async Task<IActionResult> GetPorProjeto(int projetoId)
        {
            var categorias = await _consultar.ObterPorProjetoAsync(projetoId);
            return Ok(categorias);
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] CategoriaSalvarDTO dto)
        {
            var categoria = await _salvar.CriarAsync(dto);
            return Ok(categoria);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, [FromBody] CategoriaSalvarDTO dto)
        {
            try
            {
                var categoria = await _salvar.AtualizarAsync(id, dto);
                return Ok(categoria);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        [HttpPost("{id}/excluir")]
        public async Task<IActionResult> Excluir(int id, [FromBody] ExcluirCategoriaDTO dto)
        {
            try
            {
                await _excluir.ExcluirAsync(id, dto.NovaCategoriaId);
                return Ok();
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
        }
    }
}
