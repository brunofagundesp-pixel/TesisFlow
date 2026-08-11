using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TesisFlow.Contexto.Contextos;
using TesisFlow.Modelo.DTOs;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AnexosController : ControllerBase
    {
        private readonly ApplicationDbContextTesisFlow _context;
        private readonly IWebHostEnvironment _env;

        public AnexosController(ApplicationDbContextTesisFlow context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        [HttpGet("tarefa/{tarefaId}")]
        public async Task<IActionResult> Listar(int tarefaId)
        {
            var anexos = await _context.Anexos
                .Where(a => a.TarefaId == tarefaId && a.Ativo)
                .OrderByDescending(a => a.DataCriacao)
                .Select(a => new AnexoDTO
                {
                    Id = a.Id,
                    TarefaId = a.TarefaId,
                    NomeArquivo = a.NomeArquivo,
                    Tipo = a.Tipo,
                    Tamanho = a.Tamanho,
                    UsuarioId = a.UsuarioId,
                    UsuarioNome = a.Usuario.Nome,
                    DataCriacao = a.DataCriacao
                })
                .ToListAsync();

            return Ok(anexos);
        }

        [HttpPost("upload/{tarefaId}")]
        public async Task<IActionResult> Upload(int tarefaId, [FromForm] IFormFile arquivo, [FromForm] int usuarioId)
        {
            if (arquivo == null || arquivo.Length == 0)
                return BadRequest("Arquivo invalido.");

            var uploadsDir = Path.Combine(_env.ContentRootPath, "uploads", tarefaId.ToString());
            Directory.CreateDirectory(uploadsDir);

            var nomeUnico = $"{Guid.NewGuid()}_{arquivo.FileName}";
            var caminho = Path.Combine(uploadsDir, nomeUnico);

            using var stream = new FileStream(caminho, FileMode.Create);
            await arquivo.CopyToAsync(stream);

            var anexo = new Anexo
            {
                TarefaId = tarefaId,
                NomeArquivo = arquivo.FileName,
                Caminho = nomeUnico,
                Tipo = arquivo.ContentType,
                Tamanho = arquivo.Length,
                UsuarioId = usuarioId
            };

            _context.Anexos.Add(anexo);
            await _context.SaveChangesAsync();

            return Ok(new AnexoDTO
            {
                Id = anexo.Id,
                TarefaId = anexo.TarefaId,
                NomeArquivo = anexo.NomeArquivo,
                Tipo = anexo.Tipo,
                Tamanho = anexo.Tamanho,
                UsuarioId = anexo.UsuarioId,
                UsuarioNome = "",
                DataCriacao = anexo.DataCriacao
            });
        }

        [HttpGet("download/{id}")]
        public async Task<IActionResult> Download(int id)
        {
            var anexo = await _context.Anexos.FindAsync(id);
            if (anexo == null) return NotFound();

            var uploadsDir = Path.Combine(_env.ContentRootPath, "uploads", anexo.TarefaId.ToString());
            var caminho = Path.Combine(uploadsDir, anexo.Caminho);

            if (!System.IO.File.Exists(caminho)) return NotFound();
            return PhysicalFile(caminho, anexo.Tipo, anexo.NomeArquivo);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Excluir(int id)
        {
            var anexo = await _context.Anexos.FindAsync(id);
            if (anexo == null) return NotFound();

            anexo.Ativo = false;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
