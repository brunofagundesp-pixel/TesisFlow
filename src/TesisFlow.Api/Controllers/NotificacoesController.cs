using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TesisFlow.Contexto.Contextos;
using TesisFlow.Core.Servicos.Notificacoes;
using TesisFlow.Modelo.DTOs;

namespace TesisFlow.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificacoesController : ControllerBase
    {
        private readonly NotificacaoConsultar _consultar;
        private readonly NotificacaoServico _servico;
        private readonly ApplicationDbContextTesisFlow _context;

        public NotificacoesController(
            NotificacaoConsultar consultar,
            NotificacaoServico servico,
            ApplicationDbContextTesisFlow context)
        {
            _consultar = consultar;
            _servico = servico;
            _context = context;
        }

        [HttpGet("usuario/{usuarioId}")]
        public async Task<IActionResult> GetPorUsuario(int usuarioId)
        {
            if (usuarioId != UsuarioAtual()) return Forbid();

            var notificacoes = await _consultar.ObterPorUsuarioAsync(usuarioId);
            return Ok(notificacoes);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> Post([FromBody] NotificacaoSalvarDTO dto)
        {
            var notificationDto = await _servico.CriarENotificarAsync(
                dto.Titulo, dto.Descricao, dto.Tipo, dto.Link, dto.TargetUserId, dto.TarefaId, dto.ProjetoId);

            return Ok(notificationDto);
        }

        [HttpPut("{id}/lida")]
        public async Task<IActionResult> MarcarLida(int id)
        {
            var usuarioId = UsuarioAtual();
            var notificacao = await _context.Notificacoes.FirstOrDefaultAsync(n => n.Id == id);
            if (notificacao == null) return NotFound();

            if (notificacao.TargetUserId != null && notificacao.TargetUserId != usuarioId && !User.IsInRole("Admin"))
                return Forbid();

            await _servico.MarcarComoLidaAsync(id);
            return Ok();
        }

        [HttpPut("usuario/{usuarioId}/lidas")]
        public async Task<IActionResult> MarcarTodasLidas(int usuarioId)
        {
            if (usuarioId != UsuarioAtual()) return Forbid();

            await _servico.MarcarTodasComoLidasAsync(usuarioId);
            return Ok();
        }

        [HttpPut("tarefa/{tarefaId}/lida")]
        public async Task<IActionResult> MarcarTarefaComoLida(int tarefaId, [FromQuery] int usuarioId)
        {
            if (usuarioId != UsuarioAtual()) return Forbid();

            await _servico.MarcarTarefaComoLidaAsync(tarefaId, usuarioId);
            return Ok();
        }

        private int UsuarioAtual()
        {
            var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(idStr, out var id) ? id : 0;
        }
    }
}
