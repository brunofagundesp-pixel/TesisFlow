using System.Collections.Concurrent;
using Microsoft.AspNetCore.SignalR;

namespace TesisFlow.Api.Hubs
{
    public class CallHub : Hub
    {
        private static readonly ConcurrentDictionary<string, HashSet<int>> _rooms = new();

        public override async Task OnConnectedAsync()
        {
            var userId = Context.GetHttpContext()?.Request.Query["userId"];
            if (!string.IsNullOrEmpty(userId) && int.TryParse(userId, out var uid))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{uid}");
            }
            await base.OnConnectedAsync();
        }

        public async Task<string> CriarSalaGrupo(List<int> participantIds, string iniciadorNome)
        {
            var callerId = Context.GetHttpContext()?.Request.Query["userId"];
            if (string.IsNullOrEmpty(callerId) || !int.TryParse(callerId, out var uid)) return "";

            var roomId = Guid.NewGuid().ToString("N")[..8];
            var allIds = new HashSet<int>(participantIds) { uid };
            _rooms[roomId] = allIds;

            await Groups.AddToGroupAsync(Context.ConnectionId, $"room_{roomId}");

            foreach (var pid in participantIds)
            {
                await Clients.Group($"user_{pid}").SendAsync("ChamadaGrupoRecebida",
                    roomId, uid, iniciadorNome, allIds.Select(id => new { id, nome = id == uid ? iniciadorNome : "" }).ToList());
            }

            return roomId;
        }

        public async Task EntrarSalaGrupo(string roomId)
        {
            var callerId = Context.GetHttpContext()?.Request.Query["userId"];
            if (string.IsNullOrEmpty(callerId) || !int.TryParse(callerId, out var uid)) return;

            await Groups.AddToGroupAsync(Context.ConnectionId, $"room_{roomId}");

            if (_rooms.TryGetValue(roomId, out var set))
            {
                set.Add(uid);
                await Clients.Group($"room_{roomId}").SendAsync("ParticipanteEntrou", roomId, uid, "");
            }
        }

        public async Task SairSalaGrupo(string roomId)
        {
            var callerId = Context.GetHttpContext()?.Request.Query["userId"];
            if (string.IsNullOrEmpty(callerId) || !int.TryParse(callerId, out var uid)) return;

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"room_{roomId}");

            if (_rooms.TryGetValue(roomId, out var set))
            {
                set.Remove(uid);
                if (set.Count == 0) _rooms.TryRemove(roomId, out _);
                await Clients.Group($"room_{roomId}").SendAsync("ParticipanteSaiu", roomId, uid);
            }
        }

        public async Task AdicionarParticipanteSala(string roomId, int userId)
        {
            if (_rooms.TryGetValue(roomId, out var set))
            {
                set.Add(userId);
                await Clients.Group($"user_{userId}").SendAsync("ChamadaGrupoRecebida",
                    roomId, 0, "", set.Select(id => new { id, nome = "" }).ToList());
                await Clients.Group($"room_{roomId}").SendAsync("ParticipanteEntrou", roomId, userId, "");
            }
        }

        public async Task EncerrarSala(string roomId)
        {
            if (_rooms.TryGetValue(roomId, out var set))
            {
                await Clients.Group($"room_{roomId}").SendAsync("SalaEncerrada", roomId);
                _rooms.TryRemove(roomId, out _);
            }
        }

        public async Task EnviarOfertaGrupo(string roomId, int targetId, string oferta)
        {
            var callerId = Context.GetHttpContext()?.Request.Query["userId"];
            if (string.IsNullOrEmpty(callerId) || !int.TryParse(callerId, out var uid)) return;
            await Clients.Group($"user_{targetId}").SendAsync("OfertaGrupoRecebida", roomId, uid, oferta);
        }

        public async Task EnviarRespostaGrupo(string roomId, int targetId, string resposta)
        {
            var callerId = Context.GetHttpContext()?.Request.Query["userId"];
            if (string.IsNullOrEmpty(callerId) || !int.TryParse(callerId, out var uid)) return;
            await Clients.Group($"user_{targetId}").SendAsync("RespostaGrupoRecebida", roomId, uid, resposta);
        }

        public async Task EnviarCandidatoICEGrupo(string roomId, int targetId, string candidato)
        {
            var callerId = Context.GetHttpContext()?.Request.Query["userId"];
            if (string.IsNullOrEmpty(callerId) || !int.TryParse(callerId, out var uid)) return;
            await Clients.Group($"user_{targetId}").SendAsync("CandidatoICEGrupoRecebido", roomId, uid, candidato);
        }
    }
}
