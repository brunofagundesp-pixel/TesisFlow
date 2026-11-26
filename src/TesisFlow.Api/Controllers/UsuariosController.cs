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

        public UsuariosController(
            UsuarioConsultar consultar,
            UsuarioSalvar salvar,
            UsuarioExcluir excluir,
            CaminhosService caminhos)
        {
            _consultar = consultar;
            _salvar = salvar;
            _excluir = excluir;
            _caminhos = caminhos;
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

            var diretorio = Path.Combine(_caminhos.UploadsBasePath, "avatares");
            Directory.CreateDirectory(diretorio);

            var nomeArquivo = $"{id}_{Guid.NewGuid():N}{extensao}";
            var caminho = Path.Combine(diretorio, nomeArquivo);

            using (var stream = new FileStream(caminho, FileMode.Create))
            {
                await arquivo.CopyToAsync(stream);
            }

            var fotoAnterior = usuario.Foto;

            try
            {
                await _salvar.DefinirFotoAsync(id, $"/api/Usuarios/{id}/foto?f={nomeArquivo}");
            }
            catch
            {
                if (System.IO.File.Exists(caminho))
                {
                    try { System.IO.File.Delete(caminho); } catch { /* ignora */ }
                }
                throw;
            }

            ExcluirArquivoAnterior(fotoAnterior, "avatares");

            var dto = await _consultar.ObterPorIdAsync(id);
            return Ok(dto);
        }

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

            var diretorio = Path.Combine(_caminhos.UploadsBasePath, "banners");
            Directory.CreateDirectory(diretorio);

            var nomeArquivo = $"{id}_{Guid.NewGuid():N}{extensao}";
            var caminho = Path.Combine(diretorio, nomeArquivo);

            using (var stream = new FileStream(caminho, FileMode.Create))
            {
                await arquivo.CopyToAsync(stream);
            }

            var bannerAnterior = usuario.Banner;

            try
            {
                await _salvar.DefinirBannerAsync(id, $"/api/Usuarios/{id}/banner?f={nomeArquivo}");
            }
            catch
            {
                if (System.IO.File.Exists(caminho))
                {
                    try { System.IO.File.Delete(caminho); } catch { /* ignora */ }
                }
                throw;
            }

            ExcluirArquivoAnterior(bannerAnterior, "banners");

            var dto = await _consultar.ObterPorIdAsync(id);
            return Ok(dto);
        }

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

            await _salvar.DefinirBannerAsync(id, null);

            var dto = await _consultar.ObterPorIdAsync(id);
            return Ok(dto);
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
    }

    public class UsuarioAtualizarDTO
    {
        public required string Nome { get; set; }
        public string? Cargo { get; set; }
        public string? Foto { get; set; }
    }
}
