using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TesisFlow.Contexto.Contextos;
using TesisFlow.Core.Servicos.Acesso;
using TesisFlow.Modelo.DTOs;

namespace TesisFlow.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HistoricoTarefasController : ControllerBase
    {
        private readonly ApplicationDbContextTesisFlow _context;
        private readonly ProjetoAcessoService _acesso;

        public HistoricoTarefasController(ApplicationDbContextTesisFlow context, ProjetoAcessoService acesso)
        {
            _context = context;
            _acesso = acesso;
        }

        [HttpGet("tarefa/{tarefaId}")]
        public async Task<IActionResult> Listar(int tarefaId)
        {
            if (!User.IsInRole("Admin") && !await _acesso.PodeAcessarTarefaAsync(tarefaId, UsuarioAtual()))
                return Forbid();

            var historico = await _context.HistoricoTarefas
                .Where(h => h.TarefaId == tarefaId && h.Ativo)
                .OrderByDescending(h => h.DataCriacao)
                .Select(h => new HistoricoTarefaDTO
                {
                    Id = h.Id,
                    TarefaId = h.TarefaId,
                    Campo = h.Campo,
                    ValorAntigo = h.ValorAntigo,
                    ValorNovo = h.ValorNovo,
                    UsuarioId = h.UsuarioId,
                    UsuarioNome = h.Usuario.Nome,
                    DataCriacao = h.DataCriacao.Kind == DateTimeKind.Utc
                        ? h.DataCriacao
                        : DateTime.SpecifyKind(h.DataCriacao, DateTimeKind.Utc)
                })
                .ToListAsync();

            return Ok(historico);
        }

        private int UsuarioAtual()
        {
            var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(idStr, out var id) ? id : 0;
        }
    }
}
