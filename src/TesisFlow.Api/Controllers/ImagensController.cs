using Microsoft.AspNetCore.Mvc;

namespace TesisFlow.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ImagensController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;

        public ImagensController(IWebHostEnvironment env)
        {
            _env = env;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> Upload([FromForm] IFormFile imagem)
        {
            if (imagem == null || imagem.Length == 0)
                return BadRequest("Imagem invalida.");

            var extensao = Path.GetExtension(imagem.FileName)?.ToLowerInvariant();
            if (string.IsNullOrEmpty(extensao))
                extensao = ".png";

            var nome = $"{Guid.NewGuid()}{extensao}";
            var dir = Path.Combine(_env.ContentRootPath, "uploads", "descricao");
            Directory.CreateDirectory(dir);

            var caminho = Path.Combine(dir, nome);
            using var stream = new FileStream(caminho, FileMode.Create);
            await imagem.CopyToAsync(stream);

            return Ok(new { url = $"/api/Imagens/{nome}" });
        }

        [HttpGet("{nome}")]
        public IActionResult Obter(string nome)
        {
            var nomeArquivo = Path.GetFileName(nome);
            var dir = Path.Combine(_env.ContentRootPath, "uploads", "descricao");
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
