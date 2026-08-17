using TesisFlow.Core.Interfaces;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Servicos.Notificacoes
{
    public class NotificacaoSalvar
    {
        private readonly INotificacaoRepositorio _repositorio;

        public NotificacaoSalvar(INotificacaoRepositorio repositorio)
        {
            _repositorio = repositorio;
        }

        public async Task<Notificacao> CriarAsync(string titulo, string? descricao, string tipo, string? link, int? targetUserId, int? tarefaId = null, int? projetoId = null)
        {
            var notificacao = new Notificacao
            {
                Titulo = titulo,
                Descricao = descricao,
                Tipo = tipo,
                Link = link,
                Lida = false,
                TargetUserId = targetUserId,
                TarefaId = tarefaId,
                ProjetoId = projetoId,
            };

            return await _repositorio.AdicionarAsync(notificacao);
        }

        public async Task MarcarComoLidaAsync(int id)
        {
            await _repositorio.MarcarComoLidaAsync(id);
        }

        public async Task MarcarTodasComoLidasAsync(int usuarioId)
        {
            await _repositorio.MarcarTodasComoLidasAsync(usuarioId);
        }

        public async Task MarcarTarefaComoLidaAsync(int tarefaId, int usuarioId)
        {
            await _repositorio.MarcarTarefaComoLidaAsync(tarefaId, usuarioId);
        }
    }
}
