using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TesisFlow.Api.Services;

namespace TesisFlow.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ImagensController : ControllerBase
    {
        private readonly CaminhosService _caminhos;
        private readonly FirebaseStorageService _firebase;

        public ImagensController(CaminhosService caminhos, FirebaseStorageService firebase)
        {
            _caminhos = caminhos;
            _firebase = firebase;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> Upload([FromForm] IFormFile imagem, [FromForm] int usuarioId)
        {
            if (imagem == null || imagem.Length == 0)
                return BadRequest("Imagem invalida.");

            var extensao = Path.GetExtension(imagem.FileName)?.ToLowerInvariant();
            if (string.IsNullOrEmpty(extensao))
                extensao = ".png";

            var subpasta = usuarioId > 0 ? $"descricao/usuario-{usuarioId}" : "descricao";

            using var stream = imagem.OpenReadStream();
            var url = await _firebase.UploadAsync(subpasta, stream, imagem.ContentType ?? "image/png", extensao);

            return Ok(new { url });
        }

        [AllowAnonymous]
        [HttpGet("{nome}")]
        public IActionResult Obter(string nome)
        {
            var nomeArquivo = Path.GetFileName(nome);
            var dir = Path.Combine(_caminhos.UploadsBasePath, "descricao");
            var caminho = Path.Combine(dir, nomeArquivo);

            if (!System.IO.File.Exists(caminho))
                return NotFound();

            var tipo = Path.GetExtension(nomeArquivo).ToLowerInvariant() switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".gif" => "image/gif",
                ".webp" => "image/webp",
                _ => "image/png"
            };

            return PhysicalFile(caminho, tipo);
        }
    }
}
