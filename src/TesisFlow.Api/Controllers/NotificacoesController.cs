using Microsoft.AspNetCore.Mvc;
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

        public NotificacoesController(
            NotificacaoConsultar consultar,
            NotificacaoServico servico)
        {
            _consultar = consultar;
            _servico = servico;
        }

        [HttpGet("usuario/{usuarioId}")]
        public async Task<IActionResult> GetPorUsuario(int usuarioId)
        {
            var notificacoes = await _consultar.ObterPorUsuarioAsync(usuarioId);
            return Ok(notificacoes);
        }

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
            await _servico.MarcarComoLidaAsync(id);
            return Ok();
        }

        [HttpPut("usuario/{usuarioId}/lidas")]
        public async Task<IActionResult> MarcarTodasLidas(int usuarioId)
        {
            await _servico.MarcarTodasComoLidasAsync(usuarioId);
            return Ok();
        }

        [HttpPut("tarefa/{tarefaId}/lida")]
        public async Task<IActionResult> MarcarTarefaComoLida(int tarefaId, [FromQuery] int usuarioId)
        {
            await _servico.MarcarTarefaComoLidaAsync(tarefaId, usuarioId);
            return Ok();
        }
    }
}
