using System.Security.Claims;
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
        public async Task<IActionResult> GetByTarefa(int tarefaId, [FromQuery] int skip = 0, [FromQuery] int take = 10)
        {
            var usuarioId = UsuarioAtual();
            if (!User.IsInRole("Admin") && !await PodeVerTarefaAsync(tarefaId, usuarioId))
                return Forbid();

            var resultado = await _consultar.ObterPorTarefaPaginadoAsync(tarefaId, skip, take);
            return Ok(new { resultado.Comentarios, resultado.TemMais });
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
            if (!await EhDonoOuAdminAsync(id))
                return Forbid();

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
        public async Task<IActionResult> Delete(int id)
        {
            if (!await EhDonoOuAdminAsync(id))
                return Forbid();

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

        [HttpGet("reacoes")]
        public async Task<IActionResult> ListarReacoesEmLote([FromQuery] string ids)
        {
            var idLista = (ids ?? string.Empty)
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(s => int.TryParse(s, out var n) ? n : (int?)null)
                .Where(n => n.HasValue)
                .Select(n => n!.Value)
                .Distinct()
                .ToList();

            if (idLista.Count == 0)
                return Ok(new Dictionary<int, List<ReacaoDTO>>());

            var reacoes = await _context.ComentarioReacoes
                .Where(r => EF.Constant(idLista).Contains(r.ComentarioId))
                .Include(r => r.Usuario)
                .ToListAsync();

            var resultado = reacoes
                .GroupBy(r => r.ComentarioId)
                .ToDictionary(g => g.Key, g => AgruparReacoes(g));

            return Ok(resultado);
        }

        private async Task<List<ReacaoDTO>> ListarReacoesAsync(int comentarioId)
        {
            var reacoes = await _context.ComentarioReacoes
                .Where(r => r.ComentarioId == comentarioId)
                .Include(r => r.Usuario)
                .ToListAsync();

            return AgruparReacoes(reacoes);
        }

        private static List<ReacaoDTO> AgruparReacoes(IEnumerable<ComentarioReacao> reacoes) =>
            reacoes
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

        private int UsuarioAtual()
        {
            var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(idStr, out var id) ? id : 0;
        }

        private async Task<bool> EhDonoOuAdminAsync(int comentarioId)
        {
            if (User.IsInRole("Admin")) return true;

            var comentario = await _context.Comentarios.FirstOrDefaultAsync(c => c.Id == comentarioId);
            if (comentario == null) return false;

            return comentario.UsuarioId == UsuarioAtual();
        }

        private async Task<bool> PodeVerTarefaAsync(int tarefaId, int usuarioId)
        {
            var tarefa = await _context.Tarefas.FirstOrDefaultAsync(t => t.Id == tarefaId);
            if (tarefa == null) return false;

            var projetoId = tarefa.ProjetoId;

            var ehLider = await _context.Projetos.AnyAsync(p => p.Id == projetoId && p.LiderId == usuarioId);
            if (ehLider) return true;

            return await _context.ProjetoMembros.AnyAsync(pm => pm.ProjetoId == projetoId
                && pm.UsuarioId == usuarioId && pm.Ativo && pm.Status == TesisFlow.Modelo.Enums.StatusConvite.Aceito);
        }
    }
}
