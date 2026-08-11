using Microsoft.AspNetCore.Mvc;
using TesisFlow.Core.Servicos.Usuarios;

namespace TesisFlow.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsuariosController : ControllerBase
    {
        private readonly UsuarioConsultar _consultar;
        private readonly UsuarioSalvar _salvar;
        private readonly UsuarioExcluir _excluir;

        public UsuariosController(UsuarioConsultar consultar, UsuarioSalvar salvar, UsuarioExcluir excluir)
        {
            _consultar = consultar;
            _salvar = salvar;
            _excluir = excluir;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var usuarios = await _consultar.ObterTodosAsync();
            return Ok(usuarios);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var usuario = await _consultar.ObterPorIdAsync(id);
            if (usuario == null) return NotFound();
            return Ok(usuario);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, [FromBody] UsuarioAtualizarDTO dto)
        {
            try
            {
                var usuario = await _salvar.AtualizarAsync(id, dto.Nome, dto.Cargo, dto.Foto);
                return Ok(usuario);
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

    public class UsuarioAtualizarDTO
    {
        public required string Nome { get; set; }
        public string? Cargo { get; set; }
        public string? Foto { get; set; }
    }
}
