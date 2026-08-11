using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using TesisFlow.Api.Hubs;
using TesisFlow.Core.Servicos.Mensagens;
using TesisFlow.Core.Servicos.Usuarios;
using TesisFlow.Modelo.DTOs;

namespace TesisFlow.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatController : ControllerBase
    {
        private readonly MensagemConsultar _consultar;
        private readonly MensagemSalvar _salvar;
        private readonly UsuarioConsultar _usuarioConsultar;
        private readonly IHubContext<ChatHub> _hubContext;

        public ChatController(MensagemConsultar consultar, MensagemSalvar salvar, UsuarioConsultar usuarioConsultar, IHubContext<ChatHub> hubContext)
        {
            _consultar = consultar;
            _salvar = salvar;
            _usuarioConsultar = usuarioConsultar;
            _hubContext = hubContext;
        }

        [HttpGet("conversas/{usuarioId}")]
        public async Task<IActionResult> GetContatos(int usuarioId)
        {
            var contatos = await _consultar.ObterContatosAsync(usuarioId);
            return Ok(contatos.OrderByDescending(c => c.UltimaData));
        }

        [HttpGet("conversas/{usuarioA}/{usuarioB}")]
        public async Task<IActionResult> GetHistorico(int usuarioA, int usuarioB)
        {
            var mensagens = await _consultar.ObterConversaAsync(usuarioA, usuarioB);
            return Ok(mensagens);
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] MensagemSalvarDTO dto)
        {
            var mensagem = await _salvar.EnviarAsync(dto.Texto, dto.RemetenteId, dto.DestinatarioId);

            var mensagemDto = new MensagemDTO
            {
                Id = mensagem.Id,
                RemetenteId = mensagem.RemetenteId,
                RemetenteNome = "",
                DestinatarioId = mensagem.DestinatarioId,
                Texto = mensagem.Texto,
                Lida = mensagem.Lida,
                DataCriacao = mensagem.DataCriacao,
            };

            await _hubContext.Clients.Group($"user_{dto.DestinatarioId}").SendAsync("ReceberMensagem", mensagemDto);
            await _hubContext.Clients.Group($"user_{dto.RemetenteId}").SendAsync("ReceberMensagem", mensagemDto);

            return Ok(mensagemDto);
        }

        [HttpPut("lidas/{remetenteId}/{destinatarioId}")]
        public async Task<IActionResult> MarcarLidas(int remetenteId, int destinatarioId)
        {
            await _salvar.MarcarComoLidasAsync(remetenteId, destinatarioId);
            return Ok();
        }
    }
}
