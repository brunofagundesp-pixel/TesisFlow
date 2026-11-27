using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TesisFlow.Api.Services;
using TesisFlow.Core.Servicos.Usuarios;

namespace TesisFlow.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsuariosController : ControllerBase
    {
        private const long TamanhoMaximoFoto = 5 * 1024 * 1024;

        private static readonly HashSet<string> ExtensoesPermitidas = new(StringComparer.OrdinalIgnoreCase)
        {
            ".jpg", ".jpeg", ".png", ".webp", ".gif"
        };

        private readonly UsuarioConsultar _consultar;
        private readonly UsuarioSalvar _salvar;
        private readonly UsuarioExcluir _excluir;
        private readonly CaminhosService _caminhos;
        private readonly FirebaseStorageService _firebase;

        public UsuariosController(
            UsuarioConsultar consultar,
            UsuarioSalvar salvar,
            UsuarioExcluir excluir,
            CaminhosService caminhos,
            FirebaseStorageService firebase)
        {
            _consultar = consultar;
            _salvar = salvar;
            _excluir = excluir;
            _caminhos = caminhos;
            _firebase = firebase;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var usuarios = await _consultar.ObterTodosAsync();
            return Ok(usuarios);
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("admin")]
        public async Task<IActionResult> GetAdmin()
        {
            var usuarios = await _consultar.ObterAdminAsync();
            return Ok(usuarios);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}/tesisccsid")]
        public async Task<IActionResult> DefinirTesisCcSid(int id, [FromBody] TesisCcSidAtualizarDTO dto)
        {
            try
            {
                await _salvar.DefinirTesisCcSidAsync(id, dto.TesisCcSid);
                return Ok();
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}/cargo")]
        public async Task<IActionResult> DefinirCargo(int id, [FromBody] UsuarioCargoDTO dto)
        {
            var usuarioAtualId = UsuarioAtual();

            var alvo = await _consultar.ObterEntidadePorIdAsync(id);
            if (alvo == null) return NotFound();

            if (id == usuarioAtualId && EhAdmin(alvo.Cargo) && !EhAdmin(dto.Cargo))
                return BadRequest(new { mensagem = "Você não pode remover o próprio cargo de administrador." });

            try
            {
                var usuarioDto = await _salvar.DefinirCargoAsync(id, dto.Cargo);
                return Ok(usuarioDto);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> Criar([FromBody] UsuarioCriarDTO dto)
        {
            try
            {
                var usuario = await _salvar.CriarAsync(dto.Nome, dto.Email, dto.Senha, dto.Cargo);
                var usuarioDto = await _consultar.ObterPorIdAsync(usuario.Id);
                return Ok(usuarioDto);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var usuario = await _consultar.ObterPorIdAsync(id);
            if (usuario == null) return NotFound();
            return Ok(usuario);
        }

        [Authorize(Roles = "Admin")]
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

        [HttpPost("{id}/foto")]
        public async Task<IActionResult> UploadFoto(int id, [FromForm] IFormFile? arquivo)
        {
            if (arquivo == null || arquivo.Length == 0)
                return BadRequest(new { mensagem = "Arquivo invalido." });

            if (arquivo.Length > TamanhoMaximoFoto)
                return BadRequest(new { mensagem = "A foto deve ter no maximo 5MB." });

            var extensao = Path.GetExtension(arquivo.FileName);
            if (!arquivo.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase) ||
                !ExtensoesPermitidas.Contains(extensao))
                return BadRequest(new { mensagem = "Formato de imagem nao suportado." });

            var usuario = await _consultar.ObterEntidadePorIdAsync(id);
            if (usuario == null) return NotFound();

            var fotoAnterior = usuario.Foto;

            string url;
            using (var stream = arquivo.OpenReadStream())
            {
                url = await _firebase.UploadAsync($"avatares/usuario-{id}", stream, arquivo.ContentType ?? "image/jpeg", extensao);
            }

            try
            {
                await _salvar.DefinirFotoAsync(id, url);
            }
            catch
            {
                await _firebase.DeleteAsync(url);
                throw;
            }

            ExcluirArquivoAnterior(fotoAnterior, "avatares");
            await _firebase.DeleteAsync(fotoAnterior);

            var dto = await _consultar.ObterPorIdAsync(id);
            return Ok(dto);
        }

        [AllowAnonymous]
        [HttpGet("{id}/foto")]
        public IActionResult ObterFoto(int id, [FromQuery] string? f)
        {
            if (string.IsNullOrWhiteSpace(f))
                return NotFound();

            var nomeArquivo = Path.GetFileName(f);
            var caminho = Path.Combine(_caminhos.UploadsBasePath, "avatares", nomeArquivo);

            if (!System.IO.File.Exists(caminho)) return NotFound();
            return PhysicalFile(caminho, "image/jpeg");
        }

        [HttpDelete("{id}/foto")]
        public async Task<IActionResult> RemoverFoto(int id)
        {
            var usuario = await _consultar.ObterEntidadePorIdAsync(id);
            if (usuario == null) return NotFound();

            ExcluirArquivoAnterior(usuario.Foto, "avatares");
            await _firebase.DeleteAsync(usuario.Foto);

            await _salvar.DefinirFotoAsync(id, null);

            var dto = await _consultar.ObterPorIdAsync(id);
            return Ok(dto);
        }

        [HttpPost("{id}/banner")]
        public async Task<IActionResult> UploadBanner(int id, [FromForm] IFormFile? arquivo)
        {
            if (arquivo == null || arquivo.Length == 0)
                return BadRequest(new { mensagem = "Arquivo invalido." });

            if (arquivo.Length > TamanhoMaximoFoto)
                return BadRequest(new { mensagem = "A imagem deve ter no maximo 5MB." });

            var extensao = Path.GetExtension(arquivo.FileName);
            if (!arquivo.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase) ||
                !ExtensoesPermitidas.Contains(extensao))
                return BadRequest(new { mensagem = "Formato de imagem nao suportado." });

            var usuario = await _consultar.ObterEntidadePorIdAsync(id);
            if (usuario == null) return NotFound();

            var bannerAnterior = usuario.Banner;

            string url;
            using (var stream = arquivo.OpenReadStream())
            {
                url = await _firebase.UploadAsync($"banners/usuario-{id}", stream, arquivo.ContentType ?? "image/jpeg", extensao);
            }

            try
            {
                await _salvar.DefinirBannerAsync(id, url);
            }
            catch
            {
                await _firebase.DeleteAsync(url);
                throw;
            }

            ExcluirArquivoAnterior(bannerAnterior, "banners");
            await _firebase.DeleteAsync(bannerAnterior);

            var dto = await _consultar.ObterPorIdAsync(id);
            return Ok(dto);
        }

        [AllowAnonymous]
        [HttpGet("{id}/banner")]
        public IActionResult ObterBanner(int id, [FromQuery] string? f)
        {
            if (string.IsNullOrWhiteSpace(f))
                return NotFound();

            var nomeArquivo = Path.GetFileName(f);
            var caminho = Path.Combine(_caminhos.UploadsBasePath, "banners", nomeArquivo);

            if (!System.IO.File.Exists(caminho)) return NotFound();
            return PhysicalFile(caminho, "image/jpeg");
        }

        [HttpDelete("{id}/banner")]
        public async Task<IActionResult> RemoverBanner(int id)
        {
            var usuario = await _consultar.ObterEntidadePorIdAsync(id);
            if (usuario == null) return NotFound();

            ExcluirArquivoAnterior(usuario.Banner, "banners");
            await _firebase.DeleteAsync(usuario.Banner);

            await _salvar.DefinirBannerAsync(id, null);

            var dto = await _consultar.ObterPorIdAsync(id);
            return Ok(dto);
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

        private void ExcluirArquivoAnterior(string? valor, string subpasta)
        {
            if (string.IsNullOrWhiteSpace(valor)) return;

            var indice = valor.IndexOf("?f=", StringComparison.OrdinalIgnoreCase);
            if (indice < 0) return;

            var nomeArquivo = Path.GetFileName(valor.Substring(indice + 3));
            if (string.IsNullOrWhiteSpace(nomeArquivo)) return;

            var caminho = Path.Combine(_caminhos.UploadsBasePath, subpasta, nomeArquivo);
            if (System.IO.File.Exists(caminho))
            {
                try { System.IO.File.Delete(caminho); } catch { /* ignora falha ao remover arquivo anterior */ }
            }
        }

        private int UsuarioAtual()
        {
            var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(idStr, out var id) ? id : 0;
        }

        private static bool EhAdmin(string? cargo)
        {
            return !string.IsNullOrWhiteSpace(cargo) && cargo.Trim().Equals("admin", StringComparison.OrdinalIgnoreCase);
        }
    }

    public class UsuarioAtualizarDTO
    {
        public required string Nome { get; set; }
        public string? Cargo { get; set; }
        public string? Foto { get; set; }
    }

    public class UsuarioCriarDTO
    {
        public required string Nome { get; set; }
        public required string Email { get; set; }
        public required string Senha { get; set; }
        public string? Cargo { get; set; }
    }

    public class UsuarioCargoDTO
    {
        public string? Cargo { get; set; }
    }

    public class TesisCcSidAtualizarDTO
    {
        public string? TesisCcSid { get; set; }
    }
}
