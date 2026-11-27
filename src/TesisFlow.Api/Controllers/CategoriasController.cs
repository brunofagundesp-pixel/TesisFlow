using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TesisFlow.Contexto.Contextos;
using TesisFlow.Core.Servicos.Acesso;
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
        private readonly ApplicationDbContextTesisFlow _context;
        private readonly ProjetoAcessoService _acesso;

        public CategoriasController(CategoriaConsultar consultar, CategoriaSalvar salvar, CategoriaExcluir excluir, ApplicationDbContextTesisFlow context, ProjetoAcessoService acesso)
        {
            _consultar = consultar;
            _salvar = salvar;
            _excluir = excluir;
            _context = context;
            _acesso = acesso;
        }

        [HttpGet("projeto/{projetoId}")]
        public async Task<IActionResult> GetPorProjeto(int projetoId)
        {
            if (!await PodeAsync(projetoId)) return Forbid();

            var categorias = await _consultar.ObterPorProjetoAsync(projetoId);
            return Ok(categorias);
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] CategoriaSalvarDTO dto)
        {
            if (!await PodeAsync(dto.ProjetoId)) return Forbid();

            var categoria = await _salvar.CriarAsync(dto);
            return Ok(categoria);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, [FromBody] CategoriaSalvarDTO dto)
        {
            if (!await PodeAsync(await ObterProjetoIdAsync(id))) return Forbid();

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
            if (!await PodeAsync(await ObterProjetoIdAsync(id))) return Forbid();

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

        private async Task<int> ObterProjetoIdAsync(int categoriaId)
        {
            return await _context.Categorias
                .Where(c => c.Id == categoriaId)
                .Select(c => c.ProjetoId)
                .FirstOrDefaultAsync();
        }

        private async Task<bool> PodeAsync(int projetoId)
        {
            return projetoId != 0 && (User.IsInRole("Admin") || await _acesso.PodeAcessarProjetoAsync(projetoId, UsuarioAtual()));
        }

        private int UsuarioAtual()
        {
            var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(idStr, out var id) ? id : 0;
        }
    }
}
