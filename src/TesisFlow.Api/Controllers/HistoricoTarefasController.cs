using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TesisFlow.Contexto.Contextos;
using TesisFlow.Modelo.DTOs;

namespace TesisFlow.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HistoricoTarefasController : ControllerBase
    {
        private readonly ApplicationDbContextTesisFlow _context;

        public HistoricoTarefasController(ApplicationDbContextTesisFlow context)
        {
            _context = context;
        }

        [HttpGet("tarefa/{tarefaId}")]
        public async Task<IActionResult> Listar(int tarefaId)
        {
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
                    DataCriacao = h.DataCriacao
                })
                .ToListAsync();

            return Ok(historico);
        }
    }
}
