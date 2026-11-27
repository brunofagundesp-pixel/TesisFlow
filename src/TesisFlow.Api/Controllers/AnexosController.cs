using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TesisFlow.Api.Services;
using TesisFlow.Contexto.Contextos;
using TesisFlow.Core.Servicos.Acesso;
using TesisFlow.Modelo.DTOs;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AnexosController : ControllerBase
    {
        private readonly ApplicationDbContextTesisFlow _context;
        private readonly CaminhosService _caminhos;
        private readonly ProjetoAcessoService _acesso;

        public AnexosController(ApplicationDbContextTesisFlow context, CaminhosService caminhos, ProjetoAcessoService acesso)
        {
            _context = context;
            _caminhos = caminhos;
            _acesso = acesso;
        }

        [HttpGet("tarefa/{tarefaId}")]
        public async Task<IActionResult> Listar(int tarefaId)
        {
            if (!User.IsInRole("Admin") && !await _acesso.PodeAcessarTarefaAsync(tarefaId, UsuarioAtual()))
                return Forbid();

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
                    DataCriacao = a.DataCriacao.Kind == DateTimeKind.Utc
                        ? a.DataCriacao
                        : DateTime.SpecifyKind(a.DataCriacao, DateTimeKind.Utc)
                })
                .ToListAsync();

            return Ok(anexos);
        }

        [HttpPost("upload/{tarefaId}")]
        public async Task<IActionResult> Upload(int tarefaId, [FromForm] IFormFile arquivo, [FromForm] int usuarioId)
        {
            if (!User.IsInRole("Admin") && !await _acesso.PodeAcessarTarefaAsync(tarefaId, UsuarioAtual()))
                return Forbid();

            if (arquivo == null || arquivo.Length == 0)
                return BadRequest("Arquivo invalido.");

            var uploadsDir = Path.Combine(_caminhos.UploadsBasePath, tarefaId.ToString());
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
                UsuarioId = UsuarioAtual()
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
                DataCriacao = anexo.DataCriacao.Kind == DateTimeKind.Utc
                    ? anexo.DataCriacao
                    : DateTime.SpecifyKind(anexo.DataCriacao, DateTimeKind.Utc)
            });
        }

        [HttpGet("download/{id}")]
        public async Task<IActionResult> Download(int id)
        {
            var anexo = await _context.Anexos.FindAsync(id);
            if (anexo == null) return NotFound();

            if (!User.IsInRole("Admin") && !await _acesso.PodeAcessarTarefaAsync(anexo.TarefaId, UsuarioAtual()))
                return Forbid();

            var uploadsDir = Path.Combine(_caminhos.UploadsBasePath, anexo.TarefaId.ToString());
            var caminho = Path.Combine(uploadsDir, anexo.Caminho);

            if (!System.IO.File.Exists(caminho)) return NotFound();
            return PhysicalFile(caminho, anexo.Tipo, anexo.NomeArquivo);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Excluir(int id)
        {
            var anexo = await _context.Anexos.FindAsync(id);
            if (anexo == null) return NotFound();

            if (!User.IsInRole("Admin") && anexo.UsuarioId != UsuarioAtual())
                return Forbid();

            anexo.Ativo = false;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private int UsuarioAtual()
        {
            var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(idStr, out var id) ? id : 0;
        }
    }
}
