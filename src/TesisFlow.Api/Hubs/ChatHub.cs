using System.Collections.Concurrent;
using Microsoft.AspNetCore.SignalR;
using TesisFlow.Core.Servicos.Mensagens;

namespace TesisFlow.Api.Hubs
{
    public class ChatHub : Hub
    {
        private static readonly ConcurrentDictionary<int, string> _statusMap = new();
        private readonly MensagemSalvar _mensagemSalvar;

        public ChatHub(MensagemSalvar mensagemSalvar)
        {
            _mensagemSalvar = mensagemSalvar;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = Context.GetHttpContext()?.Request.Query["userId"];
            if (!string.IsNullOrEmpty(userId) && int.TryParse(userId, out var uid))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{uid}");
                _statusMap.TryAdd(uid, "online");
                await Clients.Others.SendAsync("UsuarioOnline", uid, "online");

                var statuses = _statusMap.Select(kv => new { usuarioId = kv.Key, status = kv.Value }).ToList();
                await Clients.Caller.SendAsync("StatusInicial", statuses);
            }
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.GetHttpContext()?.Request.Query["userId"];
            if (!string.IsNullOrEmpty(userId) && int.TryParse(userId, out var uid))
            {
                _statusMap.TryRemove(uid, out _);
                await Clients.Others.SendAsync("UsuarioOnline", uid, "offline");
            }
            await base.OnDisconnectedAsync(exception);
        }

        public async Task EnviarDigitando(int destinatarioId, bool digitando)
        {
            var userId = Context.GetHttpContext()?.Request.Query["userId"];
            if (!string.IsNullOrEmpty(userId) && int.TryParse(userId, out var uid))
            {
                await Clients.Group($"user_{destinatarioId}").SendAsync("UsuarioDigitando", uid, digitando);
            }
        }

        public async Task ConfirmarEntrega(int mensagemId)
        {
            var userId = Context.GetHttpContext()?.Request.Query["userId"];
            if (string.IsNullOrEmpty(userId) || !int.TryParse(userId, out var uid))
                return;

            var remetenteId = await _mensagemSalvar.MarcarEntregueAsync(mensagemId, uid);
            if (remetenteId.HasValue)
            {
                await Clients.Group($"user_{remetenteId.Value}").SendAsync("MensagemEntregue", mensagemId);
            }
        }

        public async Task AlterarStatus(string status)
        {
            var userId = Context.GetHttpContext()?.Request.Query["userId"];
            if (!string.IsNullOrEmpty(userId) && int.TryParse(userId, out var uid))
            {
                _statusMap[uid] = status;
                await Clients.Caller.SendAsync("UsuarioOnline", uid, status);
                await Clients.Others.SendAsync("UsuarioOnline", uid, status);
            }
        }

        public async Task<List<KeyValuePair<int, string>>> ObterStatus()
        {
            return _statusMap.ToList();
        }
    }
}
