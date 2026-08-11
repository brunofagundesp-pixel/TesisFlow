using Microsoft.AspNetCore.Mvc;
using TesisFlow.Core.Servicos.Usuarios;
using TesisFlow.Modelo.DTOs;

namespace TesisFlow.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UsuarioConsultar _usuarioConsultar;
        private readonly UsuarioSalvar _usuarioSalvar;

        public AuthController(
            UsuarioConsultar usuarioConsultar,
            UsuarioSalvar usuarioSalvar)
        {
            _usuarioConsultar = usuarioConsultar;
            _usuarioSalvar = usuarioSalvar;
        }

        [HttpPost("registro")]
        public async Task<IActionResult> Registro([FromBody] UsuarioRegistroDTO dto)
        {
            try
            {
                var usuario = await _usuarioSalvar.CriarAsync(dto.Nome, dto.Email, dto.Senha);
                return Ok(new { usuario.Id, usuario.Nome, usuario.Email });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] UsuarioLoginDTO dto)
        {
            var usuario = await _usuarioConsultar.ObterEntidadePorEmailAsync(dto.Email);
            if (usuario == null)
                return Unauthorized(new { mensagem = "Email ou senha invalidos." });

            if (!BCrypt.Net.BCrypt.Verify(dto.Senha, usuario.SenhaHash))
                return Unauthorized(new { mensagem = "Email ou senha invalidos." });

            var usuarioDto = await _usuarioConsultar.ObterPorIdAsync(usuario.Id);
            return Ok(new { token = "jwt-token-tesisflow", usuario = usuarioDto });
        }
    }
}
