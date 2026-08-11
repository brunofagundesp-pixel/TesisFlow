using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TesisFlow.Contexto.Contextos;
using TesisFlow.Core.Servicos.Comentarios;
using TesisFlow.Modelo.DTOs;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ComentariosController : ControllerBase
    {
        private readonly ComentarioConsultar _consultar;
        private readonly ComentarioSalvar _salvar;
        private readonly ComentarioExcluir _excluir;
        private readonly ApplicationDbContextTesisFlow _context;

        public ComentariosController(ComentarioConsultar consultar, ComentarioSalvar salvar, ComentarioExcluir excluir, ApplicationDbContextTesisFlow context)
        {
            _consultar = consultar;
            _salvar = salvar;
            _excluir = excluir;
            _context = context;
        }

        [HttpGet("tarefa/{tarefaId}")]
        public async Task<IActionResult> GetByTarefa(int tarefaId)
        {
            var comentarios = await _consultar.ObterPorTarefaAsync(tarefaId);
            return Ok(comentarios);
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] ComentarioSalvarDTO dto)
        {
            var comentario = await _salvar.CriarAsync(dto);
            return Created(string.Empty, comentario);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, [FromBody] ComentarioSalvarDTO dto)
        {
            try
            {
                var comentario = await _salvar.AtualizarAsync(id, dto);
                return Ok(comentario);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id, [FromQuery] int usuarioId)
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

        [HttpPost("{id}/curtir")]
        public async Task<IActionResult> Curtir(int id)
        {
            try
            {
                await _salvar.CurtirAsync(id);
                return Ok();
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        [HttpPost("{id}/reacoes")]
        public async Task<IActionResult> Reagir(int id, [FromBody] ReacaoSalvarDTO dto)
        {
            var existente = await _context.ComentarioReacoes
                .FirstOrDefaultAsync(r => r.ComentarioId == id && r.UsuarioId == dto.UsuarioId);

            if (existente != null)
            {
                if (existente.Emoji == dto.Emoji)
                {
                    _context.ComentarioReacoes.Remove(existente);
                }
                else
                {
                    existente.Emoji = dto.Emoji;
                }
            }
            else
            {
                _context.ComentarioReacoes.Add(new ComentarioReacao
                {
                    ComentarioId = id,
                    UsuarioId = dto.UsuarioId,
                    Emoji = dto.Emoji
                });
            }

            await _context.SaveChangesAsync();
            return Ok(await ListarReacoesAsync(id));
        }

        [HttpGet("{id}/reacoes")]
        public async Task<IActionResult> ListarReacoes(int id)
        {
            return Ok(await ListarReacoesAsync(id));
        }

        private async Task<List<ReacaoDTO>> ListarReacoesAsync(int comentarioId)
        {
            var reacoes = await _context.ComentarioReacoes
                .Where(r => r.ComentarioId == comentarioId)
                .Include(r => r.Usuario)
                .ToListAsync();

            return reacoes
                .GroupBy(r => r.Emoji)
                .Select(g => new ReacaoDTO
                {
                    Emoji = g.Key,
                    Quantidade = g.Count(),
                    Usuarios = g.Select(r => new ReacaoUsuarioDTO
                    {
                        UsuarioId = r.UsuarioId,
                        UsuarioNome = r.Usuario.Nome
                    }).ToList()
                })
                .ToList();
        }
    }
}
