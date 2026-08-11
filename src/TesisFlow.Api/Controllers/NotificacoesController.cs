using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using TesisFlow.Api.Hubs;
using TesisFlow.Core.Servicos.Notificacoes;
using TesisFlow.Modelo.DTOs;

namespace TesisFlow.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificacoesController : ControllerBase
    {
        private readonly NotificacaoConsultar _consultar;
        private readonly NotificacaoSalvar _salvar;
        private readonly IHubContext<NotificacaoHub> _hubContext;

        public NotificacoesController(
            NotificacaoConsultar consultar,
            NotificacaoSalvar salvar,
            IHubContext<NotificacaoHub> hubContext)
        {
            _consultar = consultar;
            _salvar = salvar;
            _hubContext = hubContext;
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
            var notificacao = await _salvar.CriarAsync(
                dto.Titulo, dto.Descricao, dto.Tipo, dto.Link, dto.TargetUserId);

            var notificationDto = new NotificacaoDTO
            {
                Id = notificacao.Id,
                Titulo = notificacao.Titulo,
                Descricao = notificacao.Descricao,
                Tipo = notificacao.Tipo,
                Link = notificacao.Link,
                Lida = notificacao.Lida,
                DataCriacao = notificacao.DataCriacao,
                TargetUserId = notificacao.TargetUserId,
            };

            if (notificacao.TargetUserId.HasValue)
            {
                await _hubContext.Clients
                    .Group($"user_{notificacao.TargetUserId.Value}")
                    .SendAsync("ReceberNotificacao", notificationDto);
            }
            else
            {
                await _hubContext.Clients.All.SendAsync("ReceberNotificacao", notificationDto);
            }

            return Ok(notificationDto);
        }

        [HttpPut("{id}/lida")]
        public async Task<IActionResult> MarcarLida(int id)
        {
            await _salvar.MarcarComoLidaAsync(id);
            return Ok();
        }

        [HttpPut("usuario/{usuarioId}/lidas")]
        public async Task<IActionResult> MarcarTodasLidas(int usuarioId)
        {
            await _salvar.MarcarTodasComoLidasAsync(usuarioId);
            return Ok();
        }
    }
}
