using TesisFlow.Core.Interfaces;
using TesisFlow.Modelo.DTOs;

namespace TesisFlow.Core.Servicos.Notificacoes
{
    public class NotificacaoServico
    {
        private readonly NotificacaoSalvar _salvar;
        private readonly INotificacaoDispatcher _dispatcher;

        public NotificacaoServico(NotificacaoSalvar salvar, INotificacaoDispatcher dispatcher)
        {
            _salvar = salvar;
            _dispatcher = dispatcher;
        }

        private static DateTime ComoUtc(DateTime data) =>
            data.Kind == DateTimeKind.Utc ? data : DateTime.SpecifyKind(data, DateTimeKind.Utc);

        public async Task<NotificacaoDTO> CriarENotificarAsync(string titulo, string? descricao, string tipo, string? link, int? targetUserId, int? tarefaId = null, int? projetoId = null)
        {
            var notificacao = await _salvar.CriarAsync(titulo, descricao, tipo, link, targetUserId, tarefaId, projetoId);

            var dto = new NotificacaoDTO
            {
                Id = notificacao.Id,
                Titulo = notificacao.Titulo,
                Descricao = notificacao.Descricao,
                Tipo = notificacao.Tipo,
                Link = notificacao.Link,
                Lida = notificacao.Lida,
                DataCriacao = ComoUtc(notificacao.DataCriacao),
                TargetUserId = notificacao.TargetUserId,
                TarefaId = notificacao.TarefaId,
                ProjetoId = notificacao.ProjetoId,
            };

            await _dispatcher.EnviarAsync(dto);

            return dto;
        }

        public async Task MarcarComoLidaAsync(int id)
        {
            await _salvar.MarcarComoLidaAsync(id);
        }

        public async Task MarcarTodasComoLidasAsync(int usuarioId)
        {
            await _salvar.MarcarTodasComoLidasAsync(usuarioId);
        }

        public async Task MarcarTarefaComoLidaAsync(int tarefaId, int usuarioId)
        {
            await _salvar.MarcarTarefaComoLidaAsync(tarefaId, usuarioId);
        }
    }
}
