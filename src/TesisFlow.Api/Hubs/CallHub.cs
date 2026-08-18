using System.Collections.Concurrent;
using Microsoft.AspNetCore.SignalR;
using TesisFlow.Core.Servicos.Usuarios;

namespace TesisFlow.Api.Hubs
{
    public class CallHub : Hub
    {
        private static readonly ConcurrentDictionary<string, HashSet<int>> _rooms = new();
        private readonly UsuarioConsultar _usuarios;
        private readonly IHubContext<ChatHub> _chat;

        public CallHub(UsuarioConsultar usuarios, IHubContext<ChatHub> chat)
        {
            _usuarios = usuarios;
            _chat = chat;
        }

        private async Task<string> NomeAsync(int id)
        {
            var usuario = await _usuarios.ObterPorIdAsync(id);
            return usuario?.Nome ?? "";
        }

        public override async Task OnConnectedAsync()
        {
            var userId = Context.GetHttpContext()?.Request.Query["userId"];
            if (!string.IsNullOrEmpty(userId) && int.TryParse(userId, out var uid))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{uid}");
            }
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.GetHttpContext()?.Request.Query["userId"];
            if (!string.IsNullOrEmpty(userId) && int.TryParse(userId, out var uid))
            {
                await SairDeTodasAsSalasAsync(uid);
            }
            await base.OnDisconnectedAsync(exception);
        }

        public async Task<object> CriarSalaGrupo(List<int> participantIds, string iniciadorNome)
        {
            var callerId = Context.GetHttpContext()?.Request.Query["userId"];
            if (string.IsNullOrEmpty(callerId) || !int.TryParse(callerId, out var uid))
                return new { roomId = "", ocupados = new List<object>() };

            var ocupados = new List<object>();
            var disponiveis = new List<int>();
            foreach (var pid in participantIds)
            {
                if (PresenceStore.EmChamada.ContainsKey(pid))
                    ocupados.Add(new { id = pid, nome = await NomeAsync(pid) });
                else
                    disponiveis.Add(pid);
            }

            if (disponiveis.Count == 0)
                return new { roomId = "", ocupados };

            var roomId = Guid.NewGuid().ToString("N")[..8];
            var allIds = new HashSet<int>(disponiveis) { uid };
            _rooms[roomId] = allIds;

            await Groups.AddToGroupAsync(Context.ConnectionId, $"room_{roomId}");

            var participantes = new List<object>();
            foreach (var id in allIds)
            {
                var nome = id == uid ? iniciadorNome : await NomeAsync(id);
                participantes.Add(new { id, nome });
            }

            foreach (var pid in disponiveis)
            {
                await Clients.Group($"user_{pid}").SendAsync("ChamadaGrupoRecebida",
                    roomId, uid, iniciadorNome, participantes);
            }

            return new { roomId, ocupados };
        }

        public async Task EntrarSalaGrupo(string roomId)
        {
            var callerId = Context.GetHttpContext()?.Request.Query["userId"];
            if (string.IsNullOrEmpty(callerId) || !int.TryParse(callerId, out var uid)) return;

            var nome = await NomeAsync(uid);
            await Groups.AddToGroupAsync(Context.ConnectionId, $"room_{roomId}");

            if (_rooms.TryGetValue(roomId, out var set))
            {
                set.Add(uid);
                PresenceStore.EmChamada[uid] = roomId;
                PresenceStore.Status[uid] = "ocupado";
                await _chat.Clients.All.SendAsync("UsuarioOnline", uid, "ocupado");
                await Clients.Group($"room_{roomId}").SendAsync("ParticipanteEntrou", roomId, uid, nome);
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

            PresenceStore.EmChamada.TryRemove(uid, out _);
            PresenceStore.Status[uid] = "online";
            await _chat.Clients.All.SendAsync("UsuarioOnline", uid, "online");
        }

        public async Task<bool> AdicionarParticipanteSala(string roomId, int userId)
        {
            if (PresenceStore.EmChamada.ContainsKey(userId))
            {
                var nome = await NomeAsync(userId);
                await Clients.Group($"room_{roomId}").SendAsync("ParticipanteOcupado", userId, nome);
                return false;
            }

            if (_rooms.TryGetValue(roomId, out var set))
            {
                set.Add(userId);
                var nome = await NomeAsync(userId);

                var participantes = new List<object>();
                foreach (var id in set)
                {
                    participantes.Add(new { id, nome = id == userId ? nome : await NomeAsync(id) });
                }

                await Clients.Group($"user_{userId}").SendAsync("ChamadaGrupoRecebida",
                    roomId, 0, "", participantes);
                await Clients.Group($"room_{roomId}").SendAsync("ParticipanteEntrou", roomId, userId, nome);
                return true;
            }

            return false;
        }

        public async Task EncerrarSala(string roomId)
        {
            if (_rooms.TryGetValue(roomId, out var set))
            {
                await Clients.Group($"room_{roomId}").SendAsync("SalaEncerrada", roomId);
                _rooms.TryRemove(roomId, out _);

                foreach (var uid in set)
                {
                    PresenceStore.EmChamada.TryRemove(uid, out _);
                    PresenceStore.Status[uid] = "online";
                    await _chat.Clients.All.SendAsync("UsuarioOnline", uid, "online");
                }
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

        private async Task SairDeTodasAsSalasAsync(int uid)
        {
            var roomId = string.Empty;
            PresenceStore.EmChamada.TryRemove(uid, out roomId);
            PresenceStore.Status[uid] = "online";

            if (!string.IsNullOrEmpty(roomId) && _rooms.TryGetValue(roomId, out var set))
            {
                set.Remove(uid);
                if (set.Count == 0) _rooms.TryRemove(roomId, out _);
                await Clients.Group($"room_{roomId}").SendAsync("ParticipanteSaiu", roomId, uid);
            }

            await _chat.Clients.All.SendAsync("UsuarioOnline", uid, "online");
        }
    }
}
