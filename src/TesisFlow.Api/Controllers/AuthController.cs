using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TesisFlow.Api.Services;
using TesisFlow.Core.Servicos.Usuarios;
using TesisFlow.Modelo.DTOs;

namespace TesisFlow.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UsuarioConsultar _usuarioConsultar;
        private readonly TokenServico _tokenServico;

        public AuthController(
            UsuarioConsultar usuarioConsultar,
            TokenServico tokenServico)
        {
            _usuarioConsultar = usuarioConsultar;
            _tokenServico = tokenServico;
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] UsuarioLoginDTO dto)
        {
            var usuario = await _usuarioConsultar.ObterEntidadePorEmailAsync(dto.Email);
            if (usuario == null)
                return Unauthorized(new { mensagem = "Email ou senha invalidos." });

            if (!BCrypt.Net.BCrypt.Verify(dto.Senha, usuario.SenhaHash))
                return Unauthorized(new { mensagem = "Email ou senha invalidos." });

            var usuarioDto = await _usuarioConsultar.ObterPorIdAsync(usuario.Id);
            var token = _tokenServico.GerarToken(usuario);
            return Ok(new { token, usuario = usuarioDto });
        }
    }
}
